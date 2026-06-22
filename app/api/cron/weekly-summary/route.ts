import { NextResponse } from 'next/server';
import { createServiceRoleClient, verifyCronAuth } from '@/lib/cron-auth';
import { emailNotifyMember } from '@/lib/email/notify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// ─── /api/cron/weekly-summary ─────────────────────────────────────────────
//
// Fires once a week (Sunday morning Haiti time). For each member who has:
//   • email_notifications   = true
//   • weekly_summary_email  = true
// we compute their last-7-day activity and send a digest.
//
// We do the heavy aggregation client-side in TS rather than via a giant
// SQL group-by because the per-member numbers are tiny — and this keeps
// the cron path independent of any RPC the dashboard might rename.

type CountRow<K extends string> = Record<K, string> & { count?: number };

export async function POST(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
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

  // Eligible recipients
  const { data: prefsRaw } = await supabase
    .from('user_preferences')
    .select('user_id')
    .eq('email_notifications', true)
    .eq('weekly_summary_email', true);
  const userIds = ((prefsRaw ?? []) as Array<{ user_id: string }>).map(
    (r) => r.user_id
  );
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_recipients' });
  }

  // Compute the rolling window
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fan-in: pull every type of activity for the recipient set in 4
  // parallel queries, then group by user_id in memory. Each query is
  // bounded by the recipient list, so we never sweep the full table.
  const [
    { data: logsRaw },
    { data: tasksRaw },
    { data: badgesRaw },
    { data: profilesRaw },
  ] = await Promise.all([
    supabase
      .from('health_logs')
      .select('user_id')
      .in('user_id', userIds)
      .gte('logged_at', weekAgo),
    supabase
      .from('user_task_completions')
      .select('user_id')
      .in('user_id', userIds)
      .gte('completed_at', weekAgo),
    supabase
      .from('user_badges')
      .select('user_id, earned_at, badge_id')
      .in('user_id', userIds)
      .gte('earned_at', weekAgo),
    supabase.from('profiles').select('id, full_name, first_name').in('id', userIds),
  ]);

  const logsByUser = new Map<string, number>();
  for (const r of (logsRaw ?? []) as CountRow<'user_id'>[]) {
    logsByUser.set(r.user_id, (logsByUser.get(r.user_id) ?? 0) + 1);
  }
  const tasksByUser = new Map<string, number>();
  for (const r of (tasksRaw ?? []) as CountRow<'user_id'>[]) {
    tasksByUser.set(r.user_id, (tasksByUser.get(r.user_id) ?? 0) + 1);
  }
  const badgesByUser = new Map<string, number>();
  for (const r of (badgesRaw ?? []) as Array<{ user_id: string }>) {
    badgesByUser.set(r.user_id, (badgesByUser.get(r.user_id) ?? 0) + 1);
  }

  let sent = 0;
  for (const profile of (profilesRaw ?? []) as Array<{
    id: string;
    full_name: string | null;
    first_name: string | null;
  }>) {
    const nLogs = logsByUser.get(profile.id) ?? 0;
    const nTasks = tasksByUser.get(profile.id) ?? 0;
    const nBadges = badgesByUser.get(profile.id) ?? 0;

    // Skip members who did literally nothing this week — sending them
    // "you did 0 things" is a fast unsubscribe trigger. They'll get
    // next week's recap if they come back.
    if (nLogs + nTasks + nBadges === 0) continue;

    const body: string[] = [
      'Men yon koudèy sou aktivite ou semèn ki sot pase a:',
    ];
    if (nLogs > 0) body.push(`📊 ${nLogs} antre sou swivi sante w (sik, tansyon, pwa, kè…)`);
    if (nTasks > 0) body.push(`✅ ${nTasks} tach pwogram ou konplete`);
    if (nBadges > 0) body.push(`🏆 ${nBadges} nouvo badj ou debloke`);
    body.push(
      'Kontinye konsa — chak ti pa konte. Ou pral wè evolisyon w nan ' +
        'pwochèn semèn lan.'
    );

    await emailNotifyMember(supabase, profile.id, {
      subject: '🌿 Rezime semèn ou — Hoïs MedikaPlant',
      heading: 'Pwogrè w semèn sa a',
      body,
      linkPath: '/dashboard/health',
      linkLabel: 'Wè detay sou tablodebò',
      requirePref: 'weekly_summary_email',
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}

export const GET = POST;
