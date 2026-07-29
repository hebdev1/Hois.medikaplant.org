import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Cookieless anon client for PUBLIC, non-personalized reads — site images,
// course catalog, marketing content. It never touches cookies, so pages that
// read data only through it are NOT forced into per-request dynamic rendering:
// they can be statically generated and ISR-cached (`export const revalidate`),
// which is the single biggest lever on TTFB for public pages.
//
// It runs as the anonymous role, exactly like a logged-out visitor, so it must
// only be used for data that anon is already allowed to read under RLS.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
