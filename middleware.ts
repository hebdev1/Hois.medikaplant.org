import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only run the auth/session middleware on routes that actually gate on
  // a session. Public marketing pages (/, /klas, /kontak, /istwa-nou,
  // /konfidansyalite), API routes (they authenticate themselves), and all
  // static assets skip it entirely — so they no longer pay a Supabase Auth
  // `getUser()` network round-trip before rendering. Logged-in sessions are
  // still refreshed on any visit to a gated route below.
  //
  // Note: /checkout is intentionally NOT listed — it is reachable
  // anonymously and does its own inline auth; the no-active-plan redirect
  // that sends members to /checkout fires from the /dashboard branch.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
};
