import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getRedirectFor } from '@/lib/redirects';

// Routes that gate on a session. Only these pay the Supabase Auth
// `getUser()` round-trip (updateSession); public pages skip it — the
// performance win we made earlier is preserved.
const GATED = ['/dashboard', '/admin', '/auth', '/aprann'];

function isGated(pathname: string): boolean {
  return GATED.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) CMS redirects — cheap cached Map lookup (no per-request DB hit). Never
  //    applied to the gated app areas, which own those paths.
  if (!isGated(pathname)) {
    const hit = await getRedirectFor(pathname);
    if (hit) {
      const dest = /^https?:\/\//i.test(hit.to)
        ? hit.to
        : new URL(hit.to, request.url).toString();
      return NextResponse.redirect(dest, hit.code);
    }
    // Public path with no redirect → do nothing (no session refresh).
    return NextResponse.next();
  }

  // 2) Gated area → refresh the session as before.
  return await updateSession(request);
}

export const config = {
  // Run on every navigational path so redirects can fire, EXCEPT API routes
  // (they authenticate themselves), Next internals, and static files (anything
  // with a dot). The redirect check on public paths is a cached Map lookup.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
