import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Server-only Supabase client using the service-role key. It BYPASSES RLS,
 * so every caller MUST perform its own authorization check before touching
 * data. NEVER import this from a client component — the key must stay on the
 * server (it's already required elsewhere: cron, referral recording, admin
 * user actions).
 *
 * Used by course-delivery to: mint signed upload URLs for admins and signed
 * playback URLs for enrolled students against the private `course-videos`
 * bucket, after the action has verified the caller.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY oswa NEXT_PUBLIC_SUPABASE_URL manke.');
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
