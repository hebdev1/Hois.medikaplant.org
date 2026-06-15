// ───────────────────────────────────────────────────────────────────────────
// Referral helpers.
//
// Codes:
//   We derive an 8-character base36 code from the member's UUID + a static
//   salt so the code is:
//     • deterministic per member (same code every time — easy to surface
//       on /dashboard/settings without storing it),
//     • opaque (a UUID isn't leaked to friends),
//     • short enough to type back manually if the link breaks.
//   The DB still stores one row per ACTUAL referral, so codes don't have
//   to be globally unique — they just need to be guess-resistant.
//
// URLs:
//   Always built off NEXT_PUBLIC_SITE_URL so they survive domain changes
//   and never accidentally point at localhost / vercel preview URLs.
// ───────────────────────────────────────────────────────────────────────────

import { createHash } from 'crypto';

const SALT = 'medikaplant-referral-v1';

export function codeForUser(userId: string): string {
  // Hash + take the first 6 bytes → 8 chars of base32-ish uppercase.
  // Avoid base36 with lowercase: people can't reliably type look-alike
  // "0/o" or "1/l/i" pairs back, so we restrict to alphabet that's
  // unambiguous over a phone call.
  const hash = createHash('sha256').update(`${SALT}:${userId}`).digest();
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[hash[i] % ALPHABET.length];
  }
  return out;
}

export function buildReferralUrl(userId: string, baseUrl?: string): string {
  const base = (
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://hoismedikaplant.com'
  ).replace(/\/$/, '');
  return `${base}/auth/signup?ref=${codeForUser(userId)}`;
}

/**
 * Reverse the code → user_id lookup. We never persist the code in
 * `profiles` (it's derived), so we have to scan members linearly. For our
 * scale (< 100k members) this is fine; if we ever need to pre-compute, we
 * can materialize it as a generated column on profiles.
 */
export async function userIdForCode(
  supabase: {
    from: (
      table: string
    ) => { select: (cols: string) => { range: (a: number, b: number) => Promise<{ data: unknown }> } };
  },
  code: string
): Promise<string | null> {
  if (!code || !/^[A-Z0-9]{6,12}$/.test(code)) return null;
  const upper = code.toUpperCase();
  // Page through profile IDs and check each. This is the cold path — only
  // hit on signup, so the cost is fine vs. the value of keeping the code
  // derivable (so legacy users get their code without a backfill).
  const pageSize = 500;
  for (let page = 0; page < 200; page++) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    const { data } = (await supabase
      .from('profiles')
      .select('id')
      .range(start, end)) as { data: Array<{ id: string }> | null };
    if (!data || data.length === 0) return null;
    for (const row of data) {
      if (codeForUser(row.id) === upper) return row.id;
    }
    if (data.length < pageSize) return null;
  }
  return null;
}
