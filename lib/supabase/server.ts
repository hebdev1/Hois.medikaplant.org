import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';
import type { Database } from '@/types/database';

export function createClient() {
  // Next 15 made cookies() async. createClient() has 100+ call sites, so we
  // keep it synchronous using Next's officially-supported sync-unwrap: reads
  // stay sync and writes remain guarded (Server Components are read-only, hence
  // the try/catch below). TODO: migrate to `await cookies()` + async
  // createClient() in a later pass to drop the deprecation warning.
  const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies;

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — cookies are read-only there.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Called from a Server Component — cookies are read-only there.
          }
        },
      },
    }
  );
}
