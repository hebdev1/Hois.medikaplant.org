import { createClient } from '@supabase/supabase-js';

// Shared helpers for the email cron + webhook endpoints. Kept in /lib so
// both /api/cron/* and /api/webhooks/* can reuse them without duplicating
// the auth + service-role plumbing.

/**
 * Verify that a request was sent by our cron scheduler (pg_cron job in
 * Supabase) or by the DB trigger that fires when a user_badges row lands.
 *
 * Both pass the same secret in an Authorization: Bearer <token> header.
 * The secret comes from the CRON_SECRET env var (set in Hostinger Node.js
 * panel + in the cron.schedule() / trigger function in Supabase).
 */
export function verifyCronAuth(req: Request): { ok: true } | { ok: false; error: string } {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Fail loud — silently letting a missing secret bypass auth would mean
    // anyone could hit /api/cron/* and fan out emails to every member.
    return { ok: false, error: 'CRON_SECRET pa konfigire sou sèvè a.' };
  }
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : '';
  if (!token || token !== expected) {
    return { ok: false, error: 'Otorizasyon envalid.' };
  }
  return { ok: true };
}

/**
 * Service-role Supabase client for cron jobs.
 * Bypasses RLS so we can fan out across every user without an admin
 * session. Caller MUST verify auth before invoking.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY oswa NEXT_PUBLIC_SUPABASE_URL manke.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
