import { NextResponse } from 'next/server';
import { createServiceRoleClient, verifyCronAuth } from '@/lib/cron-auth';
import { emailNotifyMember } from '@/lib/email/notify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── /api/webhooks/badge-unlocked ─────────────────────────────────────────
//
// Fired by a Postgres AFTER INSERT trigger on user_badges via pg_net
// (see migration 062). The trigger passes the same CRON_SECRET in the
// Authorization header so we can reuse verifyCronAuth.
//
// Payload (JSON body):
//   { user_id: uuid, badge_id: uuid }
//
// We then resolve the badge name + description and send a celebratory
// email — but ONLY if the member has both:
//   • email_notifications  = true
//   • badge_unlock_email   = true
// (emailNotifyMember enforces both via requirePref).

type Payload = { user_id?: string; badge_id?: string };

export async function POST(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body JSON envalid.' },
      { status: 400 }
    );
  }
  const userId = payload.user_id;
  const badgeId = payload.badge_id;
  if (!userId || !badgeId) {
    return NextResponse.json(
      { ok: false, error: 'user_id + badge_id obligatwa.' },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }

  const { data: badgeRaw } = await supabase
    .from('badges')
    .select('name, sub, description, slug')
    .eq('id', badgeId)
    .maybeSingle();
  const badge = badgeRaw as {
    name: string;
    sub: string | null;
    description: string | null;
    slug: string;
  } | null;
  if (!badge) {
    return NextResponse.json({ ok: false, error: 'badge_not_found' }, { status: 404 });
  }

  await emailNotifyMember(supabase, userId, {
    kind: 'badge_unlock',
    vars: {
      badgeName: badge.name,
      badgeSlug: badge.slug,
      badgeSub: badge.sub,
      badgeDescription: badge.description,
    },
    requirePref: 'badge_unlock_email',
  });

  return NextResponse.json({ ok: true });
}
