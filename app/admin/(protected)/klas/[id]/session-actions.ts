'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';
import {
  createMeeting,
  deleteMeeting,
  listPastInstances,
  getParticipants,
} from '@/lib/zoom/meetings';

// Admin management of a course's live Zoom sessions. Reads/writes go through the
// service role (the new course_sessions table has no client-write policy, and
// admins aren't "enrolled" so the enrolled-only read policy wouldn't apply).

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { role: string; admin_role: AdminRole | null } | null;
  if (row?.role !== 'admin' || !hasCapability(row.admin_role, 'manage_courses')) {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return { ok: true as const, userId: user.id };
}

// Haiti has no DST — a fixed −05:00 offset. We store starts_at as a real UTC
// instant, but send Zoom the naive local time + timezone so it schedules right.
const HAITI_OFFSET = '-05:00';
const HAITI_TZ = 'America/Port-au-Prince';

export type SessionActionState = { ok?: boolean; error?: string };

export async function createCourseSession(
  courseId: string,
  _prev: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const title = get('title');
  const sessionType = get('session_type') === 'recurring' ? 'recurring' : 'single';
  const date = get('date'); // YYYY-MM-DD (Haiti local)
  const time = get('time'); // HH:MM (Haiti local)
  const durationMinutes = Math.max(
    5,
    Math.min(600, Number(get('duration_minutes')) || 90)
  );
  const scheduleText = get('schedule_text') || null;

  if (title.length < 2) return { error: 'Tit sesyon an twò kout.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Dat la pa valid.' };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: 'Lè a pa valid.' };

  const startsAtUtc = new Date(`${date}T${time}:00${HAITI_OFFSET}`).toISOString();
  const naiveLocal = `${date}T${time}:00`;

  let recurrence: { weeklyDays: number[]; endDate?: string } | undefined;
  let recurrenceJson: Record<string, unknown> | null = null;
  if (sessionType === 'recurring') {
    const weeklyDays = formData
      .getAll('weekly_days')
      .map((d) => Number(d.toString()))
      .filter((n) => n >= 1 && n <= 7);
    if (weeklyDays.length === 0) {
      return { error: 'Chwazi omwen yon jou nan semèn nan.' };
    }
    const endDate = get('end_date') || undefined;
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return { error: 'Dat fen an pa valid.' };
    }
    recurrence = { weeklyDays, endDate };
    recurrenceJson = { weekly_days: weeklyDays, end_date: endDate ?? null };
  }

  // Create the Zoom meeting first; roll it back if the DB insert fails.
  let meeting;
  try {
    meeting = await createMeeting({
      topic: title,
      type: sessionType,
      startTime: naiveLocal,
      durationMinutes,
      timezone: HAITI_TZ,
      recurrence,
    });
  } catch (e) {
    return {
      error: `Zoom pa t ka kreye reyinyon an: ${
        e instanceof Error ? e.message : 'erè'
      }`,
    };
  }

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any).from('course_sessions').insert({
    course_id: courseId,
    title,
    session_type: sessionType,
    starts_at: startsAtUtc,
    duration_minutes: durationMinutes,
    timezone: HAITI_TZ,
    recurrence: recurrenceJson,
    schedule_text: scheduleText,
    zoom_meeting_id: meeting.meetingId,
    zoom_start_url: meeting.startUrl,
    status: 'scheduled',
  });
  if (error) {
    await deleteMeeting(meeting.meetingId).catch(() => {});
    return { error: error.message };
  }

  revalidatePath(`/admin/klas/${courseId}`);
  return { ok: true };
}

export async function deleteCourseSession(
  sessionId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = svc as any;
  const { data: row } = await sb
    .from('course_sessions')
    .select('id, course_id, zoom_meeting_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!row) return { ok: false, error: 'Sesyon an pa egziste.' };

  if (row.zoom_meeting_id) {
    await deleteMeeting(row.zoom_meeting_id).catch(() => {});
  }
  const { error } = await sb.from('course_sessions').delete().eq('id', sessionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/klas/${row.course_id}`);
  return { ok: true };
}

// Pull the Zoom participant report for a session (across every occurrence for a
// recurring meeting) and mark which enrolled students actually attended,
// matched by their profile email. Best-effort, admin-triggered.
export async function syncSessionAttendance(
  sessionId: string
): Promise<{ ok: boolean; error?: string; present?: number }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = svc as any;
  const { data: session } = await sb
    .from('course_sessions')
    .select('id, course_id, zoom_meeting_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session || !session.zoom_meeting_id) {
    return { ok: false, error: 'Sesyon an pa gen reyinyon Zoom.' };
  }

  // Total attended minutes per email, summed across occurrences.
  const minutesByEmail = new Map<string, number>();
  try {
    const instances = await listPastInstances(session.zoom_meeting_id);
    const targets =
      instances.length > 0
        ? instances.map((i) => i.uuid)
        : [session.zoom_meeting_id];
    for (const t of targets) {
      const parts = await getParticipants(t);
      for (const p of parts) {
        if (!p.email) continue;
        const key = p.email.toLowerCase();
        minutesByEmail.set(
          key,
          (minutesByEmail.get(key) ?? 0) + Math.round(p.durationSeconds / 60)
        );
      }
    }
  } catch (e) {
    return {
      ok: false,
      error: `Zoom: ${e instanceof Error ? e.message : 'erè'}`,
    };
  }

  const { data: regs } = await sb
    .from('course_session_registrants')
    .select('user_id')
    .eq('session_id', sessionId);
  const uids = [
    ...new Set(((regs ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)),
  ];
  if (uids.length === 0) return { ok: true, present: 0 };

  const { data: profs } = await sb
    .from('profiles')
    .select('id, email')
    .in('id', uids);
  const emailByUid = new Map<string, string>();
  for (const p of (profs ?? []) as Array<{ id: string; email: string | null }>) {
    if (p.email) emailByUid.set(p.id, p.email.toLowerCase());
  }

  let present = 0;
  for (const uid of uids) {
    const email = emailByUid.get(uid);
    const mins = email ? minutesByEmail.get(email) ?? 0 : 0;
    const attended = mins > 0;
    if (attended) present++;
    await sb
      .from('course_session_registrants')
      .update({ attended, attended_minutes: attended ? mins : null })
      .eq('session_id', sessionId)
      .eq('user_id', uid);
  }

  revalidatePath(`/admin/klas/${session.course_id}`);
  return { ok: true, present };
}
