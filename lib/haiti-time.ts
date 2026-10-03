// Shared Haiti-timezone helpers. Haiti observes DST (US rules, since 2017), so a
// fixed -05:00 offset is wrong ~8 months a year and shifts a stored UTC instant
// by an hour vs. the DST-aware display. We derive the actual
// America/Port-au-Prince offset for a specific date via Intl. Native Date + Intl
// only (no date library in this repo).

export const HAITI_TZ = 'America/Port-au-Prince';

function tzOffsetMinutes(utcMillis: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: HAITI_TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const m: Record<string, number> = {};
  for (const p of dtf.formatToParts(new Date(utcMillis))) {
    if (p.type !== 'literal') m[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(m.year, m.month - 1, m.day, m.hour % 24, m.minute, m.second);
  return (asUtc - utcMillis) / 60000; // minutes the zone is ahead of UTC
}

/** Convert a Haiti-local date (YYYY-MM-DD) + time (HH:MM) to a UTC ISO instant. */
export function haitiLocalToUtcISO(date: string, time: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const naiveAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  const off = tzOffsetMinutes(naiveAsUtc);
  let utc = naiveAsUtc - off * 60000;
  // Re-check once in case the first guess crossed a DST boundary.
  const off2 = tzOffsetMinutes(utc);
  if (off2 !== off) utc = naiveAsUtc - off2 * 60000;
  return new Date(utc).toISOString();
}
