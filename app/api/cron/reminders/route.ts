import { NextResponse } from 'next/server';
import { createServiceRoleClient, verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// ─── /api/cron/reminders ──────────────────────────────────────────────────
//
// Fires once a day (morning Haiti time). Creates in-app notifications for:
//   1. Treatment adherence — a member has an active "do it" treatment
//      (medication / herbal / lifestyle) they have NOT marked done today.
//   2. Health-log nudge — an engaged member (has active treatments) who has
//      not logged any metric in the last 3 days.
//
// Notifications land in the bell (notifications table, target=user). Dedup:
//   • treatment reminder — at most once per day per member.
//   • health-log nudge   — at most once every 3 days per member.

const TREATMENT_TITLE = 'Sonje tretman ou jodi a';
const LOG_TITLE = 'Ann kontinye swiv sante w';
const TRACKABLE_KINDS = ['medication', 'herbal', 'lifestyle'];

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

  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00Z`;
  const threeDaysAgo = new Date(now - 3 * 86400000).toISOString();

  // ── Dedup: reminder notifications already sent in the last 3 days ────────
  const { data: recentReminders } = await supabase
    .from('notifications')
    .select('title, target_user_id, created_at')
    .eq('target', 'user')
    .gte('created_at', threeDaysAgo)
    .in('title', [TREATMENT_TITLE, LOG_TITLE]);

  const treatmentSentToday = new Set<string>();
  const logSentRecently = new Set<string>();
  for (const r of (recentReminders ?? []) as Array<{
    title: string;
    target_user_id: string | null;
    created_at: string;
  }>) {
    if (!r.target_user_id) continue;
    if (r.title === TREATMENT_TITLE && r.created_at >= todayStart) {
      treatmentSentToday.add(r.target_user_id);
    }
    if (r.title === LOG_TITLE) logSentRecently.add(r.target_user_id);
  }

  // ── 1. Treatment adherence reminders ─────────────────────────────────────
  const { data: treatmentsRaw } = await supabase
    .from('treatment_recommendations')
    .select('id, user_id')
    .eq('status', 'active')
    .in('kind', TRACKABLE_KINDS);
  const activeTreatments = (treatmentsRaw ?? []) as Array<{
    id: string;
    user_id: string;
  }>;

  const doneTreatmentIds = new Set<string>();
  if (activeTreatments.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doses } = await (supabase as any)
      .from('treatment_doses')
      .select('treatment_id')
      .eq('taken_on', today)
      .in(
        'treatment_id',
        activeTreatments.map((t) => t.id)
      );
    for (const d of (doses ?? []) as Array<{ treatment_id: string }>) {
      doneTreatmentIds.add(d.treatment_id);
    }
  }

  const needTreatmentReminder = new Set<string>();
  for (const t of activeTreatments) {
    if (!doneTreatmentIds.has(t.id)) needTreatmentReminder.add(t.user_id);
  }

  // ── 2. Health-log nudge (engaged members only) ───────────────────────────
  const engagedUserIds = [...new Set(activeTreatments.map((t) => t.user_id))];
  const needLogReminder = new Set<string>();
  if (engagedUserIds.length > 0) {
    const { data: recentLogs } = await supabase
      .from('health_logs')
      .select('user_id')
      .in('user_id', engagedUserIds)
      .gte('logged_at', threeDaysAgo);
    const loggedRecently = new Set(
      ((recentLogs ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)
    );
    for (const uid of engagedUserIds) {
      if (!loggedRecently.has(uid)) needLogReminder.add(uid);
    }
  }

  // ── Build + insert ────────────────────────────────────────────────────────
  const rows: Array<{
    title: string;
    message: string;
    target: 'user';
    target_user_id: string;
    link_url: string;
  }> = [];

  for (const uid of needTreatmentReminder) {
    if (treatmentSentToday.has(uid)) continue;
    rows.push({
      title: TREATMENT_TITLE,
      message:
        'Ou gen tretman aktif pou w swiv jodi a. Make yo « fèt » lè w fini — sa ede w rete sou wout la.',
      target: 'user',
      target_user_id: uid,
      link_url: '/dashboard',
    });
  }

  for (const uid of needLogReminder) {
    if (logSentRecently.has(uid)) continue;
    rows.push({
      title: LOG_TITLE,
      message:
        'Ou poko anrejistre mezi sante w depi kèk jou. Yon ti mezi jodi a ede Ton vye swiv pwogrè w.',
      target: 'user',
      target_user_id: uid,
      link_url: '/dashboard/health',
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    treatment_reminders: rows.filter((r) => r.title === TREATMENT_TITLE).length,
    log_reminders: rows.filter((r) => r.title === LOG_TITLE).length,
  });
}

export const GET = POST;
