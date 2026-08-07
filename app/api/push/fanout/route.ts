import { NextResponse } from 'next/server';
import { verifyCronAuth, createServiceRoleClient } from '@/lib/cron-auth';
import { sendPushToUser } from '@/lib/push/send';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// ─── /api/push/fanout ───────────────────────────────────────────────────────
// Called by a DB trigger (via pg_net) right after a notification row is
// inserted. Resolves the notification's recipients (all / plan / user) and
// delivers a Web Push to each recipient's devices. CRON_SECRET-guarded — the
// same shared secret the cron jobs + triggers use.

export async function POST(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    notification_id?: string;
  };
  const notificationId = body.notification_id;
  if (!notificationId) {
    return NextResponse.json(
      { ok: false, error: 'missing notification_id' },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceRoleClient() as any;
  const { data: n } = await sb
    .from('notifications')
    .select('id, title, message, link_url, target, target_plan, target_user_id')
    .eq('id', notificationId)
    .maybeSingle();
  if (!n) return NextResponse.json({ ok: true, skipped: 'not_found' });

  // Resolve recipients by target. For 'all' we only fan out to users who
  // actually have a push subscription (avoids scanning every profile).
  let userIds: string[] = [];
  if (n.target === 'user' && n.target_user_id) {
    userIds = [n.target_user_id];
  } else if (n.target === 'plan' && n.target_plan) {
    const { data } = await sb.from('profiles').select('id').eq('plan', n.target_plan);
    userIds = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
  } else if (n.target === 'all') {
    const { data } = await sb.from('push_subscriptions').select('user_id');
    userIds = [
      ...new Set(((data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)),
    ];
  }

  const payload = {
    title: n.title as string,
    body: (n.message as string) ?? '',
    url: (n.link_url as string) ?? '/dashboard/notifications',
    tag: `notif-${n.id}`,
  };

  let pushes = 0;
  for (const uid of userIds) {
    const res = await sendPushToUser(uid, payload);
    if (res) pushes += res.sent;
  }

  return NextResponse.json({ ok: true, recipients: userIds.length, pushes });
}
