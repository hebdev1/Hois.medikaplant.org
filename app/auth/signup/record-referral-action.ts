'use server';

import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { userIdForCode } from '@/lib/referral';

// ───────────────────────────────────────────────────────────────────────────
// Record a referral row when a new account finishes signup with a ?ref=…
// code in the URL. Idempotent — calling this twice for the same referee
// just no-ops on the UNIQUE constraint over referee_user_id.
//
// Why service-role: the new user IS the referee, not the referrer, so the
// RLS check (referrer_user_id = auth.uid()) would reject this insert. We
// use the service-role key locally, server-side only — never exposed to
// the browser. SUPABASE_SERVICE_ROLE_KEY is already required by the rest
// of the admin flows.
// ───────────────────────────────────────────────────────────────────────────

export async function recordReferralSignup(input: {
  code: string;
  refereeEmail: string;
}): Promise<{ ok: true; referrerId: string } | { ok: false; error: string }> {
  const code = (input.code || '').trim().toUpperCase();
  const email = (input.refereeEmail || '').trim().toLowerCase();
  if (!code || !email) return { ok: false, error: 'invalid_input' };

  // The caller (just-signed-up user) has an active session, so we can use
  // the regular server client to read their own id without leaking the
  // service-role key into the auth flow.
  const auth = createServerSupabase();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user || user.email?.toLowerCase() !== email) {
    return { ok: false, error: 'session_mismatch' };
  }

  const referrerId = await userIdForCode(auth as never, code);
  if (!referrerId) return { ok: false, error: 'unknown_code' };
  if (referrerId === user.id) {
    return { ok: false, error: 'self_referral' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: 'service_key_missing' };

  const admin = createAdminSupabase(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from('referrals').insert({
    code,
    referrer_user_id: referrerId,
    referee_email: email,
    referee_user_id: user.id,
    signed_up_at: new Date().toISOString(),
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    return { ok: false, error: error.message };
  }
  return { ok: true, referrerId };
}
