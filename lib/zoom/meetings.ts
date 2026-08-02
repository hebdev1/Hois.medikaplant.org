import 'server-only';
import { zoomFetch } from './client';

// Zoom meeting + registrant + attendance helpers. Server-only (see ./client).
// Every function returns plain data or throws a sanitized Error — no Zoom
// secret or token is ever included in an error message.

const HAITI_TZ = 'America/Port-au-Prince';

export type CreateMeetingInput = {
  topic: string;
  type: 'single' | 'recurring';
  startTime: string; // ISO8601, e.g. '2026-08-10T23:00:00Z'
  durationMinutes: number;
  timezone?: string;
  // recurring only:
  recurrence?: {
    weeklyDays: number[]; // Zoom weekday codes: Sun=1 … Sat=7
    repeatInterval?: number;
    endDate?: string; // 'YYYY-MM-DD'
    occurrences?: number;
  };
};

export type CreatedMeeting = {
  meetingId: string;
  startUrl: string; // host link — store server-side, never send to students
  joinUrl: string; // generic join link (per-student links come from addRegistrant)
};

// Create a Zoom meeting with registration enabled (approval_type 0) so each
// registrant gets a unique join link. Recurring meetings use
// registration_type 2 (register once, attend all occurrences).
export async function createMeeting(
  input: CreateMeetingInput
): Promise<CreatedMeeting> {
  const settings: Record<string, unknown> = {
    approval_type: 0, // automatically approve → registration on → per-registrant links
    join_before_host: false,
    waiting_room: false,
    meeting_authentication: false,
  };

  const body: Record<string, unknown> = {
    topic: input.topic,
    type: input.type === 'recurring' ? 8 : 2,
    start_time: input.startTime,
    duration: input.durationMinutes,
    timezone: input.timezone ?? HAITI_TZ,
    settings,
  };

  if (input.type === 'recurring' && input.recurrence) {
    const r = input.recurrence;
    const recurrence: Record<string, unknown> = {
      type: 2, // weekly
      repeat_interval: r.repeatInterval ?? 1,
      weekly_days: r.weeklyDays.join(','),
    };
    if (r.endDate) recurrence.end_date_time = `${r.endDate}T23:59:59Z`;
    else if (r.occurrences) recurrence.end_times = r.occurrences;
    body.recurrence = recurrence;
    settings.registration_type = 2; // register once, attend all
  }

  const res = await zoomFetch('/users/me/meetings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Zoom createMeeting failed (${res.status}): ${await safeText(res)}`
    );
  }
  const data = (await res.json()) as {
    id: number;
    start_url: string;
    join_url: string;
  };
  return {
    meetingId: String(data.id),
    startUrl: data.start_url,
    joinUrl: data.join_url,
  };
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const res = await zoomFetch(`/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
  });
  // 204 = deleted, 404 = already gone — both are fine.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Zoom deleteMeeting failed (${res.status}).`);
  }
}

export type Registrant = {
  firstName: string;
  lastName?: string;
  email: string;
};

export type AddedRegistrant = {
  registrantId: string;
  joinUrl: string; // the student's personal join link
};

// Register one student. For a recurring meeting (registration_type 2) a single
// call — with no occurrence_ids — covers every occurrence. Zoom emails the
// student their personal link automatically.
export async function addRegistrant(
  meetingId: string,
  person: Registrant
): Promise<AddedRegistrant> {
  const res = await zoomFetch(
    `/meetings/${encodeURIComponent(meetingId)}/registrants`,
    {
      method: 'POST',
      body: JSON.stringify({
        first_name: person.firstName,
        last_name: person.lastName || undefined,
        email: person.email,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(
      `Zoom addRegistrant failed (${res.status}): ${await safeText(res)}`
    );
  }
  const data = (await res.json()) as { registrant_id: string; join_url: string };
  return { registrantId: data.registrant_id, joinUrl: data.join_url };
}

export type PastInstance = { uuid: string; startTime: string };

// A recurring meeting produces one past instance per occurrence; a single
// meeting produces one. Each has its own UUID used for attendance reporting.
export async function listPastInstances(
  meetingId: string
): Promise<PastInstance[]> {
  const res = await zoomFetch(
    `/past_meetings/${encodeURIComponent(meetingId)}/instances`
  );
  if (!res.ok) {
    if (res.status === 404) return []; // never met yet
    throw new Error(`Zoom listPastInstances failed (${res.status}).`);
  }
  const data = (await res.json()) as {
    meetings?: Array<{ uuid: string; start_time: string }>;
  };
  return (data.meetings ?? []).map((m) => ({
    uuid: m.uuid,
    startTime: m.start_time,
  }));
}

export type Participant = {
  email: string | null;
  name: string;
  durationSeconds: number;
};

// Zoom requires a meeting UUID that begins with '/' or contains '//' to be
// double-URL-encoded when used as a path segment.
function encodeUuid(uuid: string): string {
  const once = encodeURIComponent(uuid);
  return uuid.startsWith('/') || uuid.includes('//')
    ? encodeURIComponent(once)
    : once;
}

// Attendance for one occurrence (pass a UUID from listPastInstances, or a
// meeting id for a single non-recurring meeting). Requires the report scope +
// a Pro account.
export async function getParticipants(
  meetingUuidOrId: string
): Promise<Participant[]> {
  const res = await zoomFetch(
    `/report/meetings/${encodeUuid(meetingUuidOrId)}/participants?page_size=300`
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Zoom getParticipants failed (${res.status}).`);
  }
  const data = (await res.json()) as {
    participants?: Array<{
      user_email?: string;
      name?: string;
      duration?: number;
    }>;
  };
  return (data.participants ?? []).map((p) => ({
    email: p.user_email ?? null,
    name: p.name ?? '',
    durationSeconds: p.duration ?? 0,
  }));
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return '';
  }
}
