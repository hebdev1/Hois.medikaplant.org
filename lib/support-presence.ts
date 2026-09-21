// Support availability + identity — the shared model behind the "An liy /
// Pa disponib" badge shown in the member chat (floating widget + full page).
//
// Pure, isomorphic logic (NO 'use server', NO imports): both the server
// (initial render) and the client (live re-check every minute) import from
// here. The DB read + caching lives in lib/support-settings.ts.

export type DayHours = {
  enabled: boolean;
  /** "HH:MM" 24h, local to `SupportSettings.timezone`. */
  start: string;
  end: string;
};

export type SupportSettings = {
  /** 'auto' = follow the weekly schedule; 'online'/'offline' force the badge. */
  mode: 'auto' | 'online' | 'offline';
  /** Exactly 7 entries, index 0=Sunday .. 6=Saturday (matches Date.getDay()). */
  hours: DayHours[];
  /** IANA timezone the schedule is expressed in. */
  timezone: string;
  /** Shown to members when support is offline. */
  offlineMessage: string;
  /** Global support identity shown in the chat header (falls back per-thread). */
  agentName: string | null;
  agentRole: string | null;
  agentPhotoUrl: string | null;
};

export type Presence = {
  online: boolean;
  /** Short badge label, e.g. "An liy" / "Pa disponib". */
  label: string;
  /** One-line detail, e.g. "N ap reponn touswit" or when we reopen. */
  detail: string;
};

// Kreyòl day names, index 0=Sunday .. 6=Saturday.
export const KREYOL_DAYS = [
  'Dimanch',
  'Lendi',
  'Madi',
  'Mèkredi',
  'Jedi',
  'Vandredi',
  'Samdi',
] as const;

// Monday-first display order (for the admin editor); values are getDay() indices.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DEFAULT_TIMEZONE = 'America/Port-au-Prince';

export const DEFAULT_OFFLINE_MESSAGE =
  'Nou pa disponib kounye a. Kite mesaj ou — n ap reponn ou pi bonè.';

function defaultHours(): DayHours[] {
  return [
    { enabled: false, start: '09:00', end: '17:00' }, // Sun
    { enabled: true, start: '09:00', end: '17:00' }, // Mon
    { enabled: true, start: '09:00', end: '17:00' }, // Tue
    { enabled: true, start: '09:00', end: '17:00' }, // Wed
    { enabled: true, start: '09:00', end: '17:00' }, // Thu
    { enabled: true, start: '09:00', end: '17:00' }, // Fri
    { enabled: true, start: '09:00', end: '13:00' }, // Sat
  ];
}

export const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  mode: 'auto',
  hours: defaultHours(),
  timezone: DEFAULT_TIMEZONE,
  offlineMessage: DEFAULT_OFFLINE_MESSAGE,
  agentName: null,
  agentRole: null,
  agentPhotoUrl: null,
};

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function clampTime(v: unknown, fallback: string): string {
  return typeof v === 'string' && TIME_RE.test(v) ? v.padStart(5, '0') : fallback;
}

/** Coerce an unknown `hours` value (jsonb) into a safe 7-entry array. */
export function normalizeHours(raw: unknown): DayHours[] {
  const base = defaultHours();
  if (!Array.isArray(raw)) return base;
  return base.map((fallback, i) => {
    const d = raw[i] as Partial<DayHours> | undefined;
    if (!d || typeof d !== 'object') return fallback;
    return {
      enabled: typeof d.enabled === 'boolean' ? d.enabled : fallback.enabled,
      start: clampTime(d.start, fallback.start),
      end: clampTime(d.end, fallback.end),
    };
  });
}

/**
 * Build a safe SupportSettings from a raw DB row (snake_case) or a partial.
 * Anything missing or malformed falls back to the defaults, so the badge and
 * chat header always render.
 */
export function normalizeSupportSettings(raw: unknown): SupportSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const mode = r.availability_mode ?? r.mode;
  const offline =
    (typeof r.offline_message === 'string' && r.offline_message.trim()) ||
    (typeof (r as { offlineMessage?: unknown }).offlineMessage === 'string' &&
      ((r as { offlineMessage?: string }).offlineMessage ?? '').trim()) ||
    DEFAULT_OFFLINE_MESSAGE;
  const tz = r.timezone;
  const str = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim() : null;

  return {
    mode: mode === 'online' || mode === 'offline' ? mode : 'auto',
    hours: normalizeHours(r.hours),
    timezone: typeof tz === 'string' && tz.trim() ? tz : DEFAULT_TIMEZONE,
    offlineMessage: offline,
    agentName: str(r.agent_name ?? (r as { agentName?: unknown }).agentName),
    agentRole: str(r.agent_role ?? (r as { agentRole?: unknown }).agentRole),
    agentPhotoUrl: str(
      r.agent_photo_url ?? (r as { agentPhotoUrl?: unknown }).agentPhotoUrl
    ),
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return (h % 24) * 60 + (m || 0);
}

// Current weekday (0=Sun) + minutes-since-midnight in a given IANA timezone.
function nowInTimezone(tz: string, now: Date): { day: number; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const wd: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const day = wd[get('weekday')] ?? now.getDay();
    const hour = parseInt(get('hour') || '0', 10) % 24;
    const minute = parseInt(get('minute') || '0', 10);
    return { day, minutes: hour * 60 + minute };
  } catch {
    // Unknown timezone → fall back to the runtime's local clock.
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
  }
}

function isOpenAt(h: DayHours | undefined, minutes: number): boolean {
  if (!h || !h.enabled) return false;
  const start = toMinutes(h.start);
  const end = toMinutes(h.end);
  if (end <= start) return false; // guard malformed / overnight ranges
  return minutes >= start && minutes < end;
}

// When are we next open? Returns a short Kreyòl label, or null if never.
function nextOpenLabel(
  s: SupportSettings,
  day: number,
  minutes: number
): string | null {
  for (let offset = 0; offset <= 7; offset++) {
    const d = (day + offset) % 7;
    const h = s.hours[d];
    if (!h || !h.enabled) continue;
    const start = toMinutes(h.start);
    if (offset === 0 && minutes >= start) continue; // today, already past open
    const when =
      offset === 0 ? 'jodi a' : offset === 1 ? 'demen' : KREYOL_DAYS[d];
    return `N ap tounen ${when} a ${h.start}`;
  }
  return null;
}

/** Resolve the live presence from settings + the current time. */
export function computePresence(
  s: SupportSettings,
  now: Date = new Date()
): Presence {
  if (s.mode === 'online') {
    return { online: true, label: 'An liy', detail: 'N ap reponn touswit' };
  }
  if (s.mode === 'offline') {
    return { online: false, label: 'Pa disponib', detail: s.offlineMessage };
  }
  const { day, minutes } = nowInTimezone(s.timezone, now);
  if (isOpenAt(s.hours[day], minutes)) {
    return { online: true, label: 'An liy', detail: 'N ap reponn touswit' };
  }
  return {
    online: false,
    label: 'Pa disponib',
    detail: nextOpenLabel(s, day, minutes) ?? s.offlineMessage,
  };
}

/** Display name/role for the chat header (global identity, per-thread fallback). */
export function resolveAgentIdentity(
  s: SupportSettings,
  fallback: { name: string; role: string; initials: string }
): { name: string; role: string; initials: string; photoUrl: string | null } {
  const name = s.agentName || fallback.name;
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || fallback.initials;
  return {
    name,
    role: s.agentRole || fallback.role,
    initials,
    photoUrl: s.agentPhotoUrl,
  };
}
