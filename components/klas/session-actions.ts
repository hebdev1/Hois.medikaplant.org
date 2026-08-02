'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { addRegistrant } from '@/lib/zoom/meetings';

export type JoinResult =
  | { ok: true; joinUrl: string }
  | { ok: false; locked?: boolean; error?: string };

// Return the enrolled student's personal Zoom join link for a session, creating
// (registering) it lazily on first request. Uses the service role so it can read
// the meeting id (withheld from clients) and write the registrant row. Never
// accepts a client-supplied identity — always the student's own profile.
export async function getSessionJoinLink(sessionId: string): Promise<JoinResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, locked: true };

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = svc as any;

  const { data: session } = await sb
    .from('course_sessions')
    .select('id, course_id, zoom_meeting_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session || !session.zoom_meeting_id) {
    return { ok: false, error: 'not_found' };
  }

  // Access control: only enrolled students are ever registered.
  const { data: enrolled } = await sb
    .from('course_enrollments')
    .select('id')
    .eq('course_id', session.course_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!enrolled) return { ok: false, locked: true };

  // Already registered? Return the stored personal link.
  const { data: existing } = await sb
    .from('course_session_registrants')
    .select('join_url')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing?.join_url) return { ok: true, joinUrl: existing.join_url };

  const { data: profile } = await sb
    .from('profiles')
    .select('first_name, last_name, full_name, email')
    .eq('id', user.id)
    .maybeSingle();
  const email = (profile?.email || user.email || '').trim();
  if (!email) return { ok: false, error: 'no_email' };
  const firstName =
    (profile?.first_name || profile?.full_name?.split(' ')[0] || 'Elèv').trim();
  const lastName =
    (profile?.last_name ||
      profile?.full_name?.split(' ').slice(1).join(' ') ||
      '').trim() || undefined;

  try {
    const reg = await addRegistrant(session.zoom_meeting_id, {
      firstName,
      lastName,
      email,
    });
    const { error: insErr } = await sb
      .from('course_session_registrants')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        zoom_registrant_id: reg.registrantId,
        join_url: reg.joinUrl,
      });
    // A concurrent first-view may have inserted already (pk conflict, 23505) —
    // that's fine, the link Zoom returned still works.
    if (insErr && String(insErr.code) !== '23505') {
      return { ok: true, joinUrl: reg.joinUrl };
    }
    return { ok: true, joinUrl: reg.joinUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'zoom_error' };
  }
}
