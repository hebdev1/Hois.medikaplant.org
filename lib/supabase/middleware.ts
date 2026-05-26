import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
  // /checkout is intentionally NOT gated here — anonymous visitors must be
  // able to land on the checkout page with their plan choice and complete
  // the login/signup inline while they purchase. Only /dashboard requires a
  // session up front.
  const isMemberRoute = pathname.startsWith('/dashboard');
  const isMemberAuthRoute =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');

  // ── 1. Unauthed visits ─────────────────────────────────────────────────
  if (!user) {
    // /admin/* (except /admin/login) → /admin/login
    if (isAdminRoute && !isAdminLogin) {
      const url = request.nextUrl.clone();
      url.search = '';
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    // /dashboard/* or /checkout → /auth/login?redirect=…
    if (isMemberRoute) {
      const url = request.nextUrl.clone();
      const originalSearch = request.nextUrl.search;
      const originalPlan = request.nextUrl.searchParams.get('plan');
      url.search = '';
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', `${pathname}${originalSearch}`);
      if (originalPlan) url.searchParams.set('plan', originalPlan);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── 2. Authed: read role from JWT claim (set by custom_access_token_hook).
  //    Falls back to a DB read if the hook hasn't populated user_metadata
  //    yet — that path only fires for sessions issued BEFORE the hook was
  //    enabled in the dashboard. Once the user signs in again the hook
  //    runs and we hit the fast path forever after.
  const metadataRole = (user.user_metadata as { app_role?: string } | null)
    ?.app_role;
  let role: 'user' | 'admin' = 'user';
  if (metadataRole === 'admin' || metadataRole === 'user') {
    role = metadataRole;
  } else {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = (profileRaw as { role: 'user' | 'admin' } | null)?.role ?? 'user';
  }
  const isAdmin = role === 'admin';

  // Already signed in but visiting a public auth/login page → bounce home
  if (isMemberAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Already signed in as admin visiting /admin/login → straight into /admin
  // (mirrors the page-level check; covers the case where the page is cached
  // or hit before the page-level guard runs)
  if (isAdmin && isAdminLogin) {
    const url = request.nextUrl.clone();
    url.search = '';
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // ── 3. Strict isolation — keep admins inside /admin ────────────────────
  // If the signed-in user is admin and tries to reach any /dashboard or
  // /checkout URL (including via the browser Back button rewinding through
  // history), bounce them back to /admin so the admin shell stays sticky.
  if (isAdmin && isMemberRoute) {
    const url = request.nextUrl.clone();
    url.search = '';
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // ── 4. Non-admin trying to enter /admin/* → /admin/login?error=not_admin
  if (!isAdmin && isAdminRoute && !isAdminLogin) {
    const url = request.nextUrl.clone();
    url.search = '';
    url.pathname = '/admin/login';
    url.searchParams.set('error', 'not_admin');
    return NextResponse.redirect(url);
  }

  // ── 4b. Member without an active subscription → forced to checkout ────
  // Cancelling the plan signs the user out AND leaves zero active subs.
  // If they ever come back (sign in via /auth/login, then land on
  // /dashboard or any sub-path) they must purchase a new plan before
  // regaining access. Admins are exempt from this gate.
  if (!isAdmin && isMemberRoute) {
    const { count } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if ((count ?? 0) === 0) {
      const url = request.nextUrl.clone();
      url.search = '';
      url.pathname = '/checkout';
      url.searchParams.set('reason', 'no_active_plan');
      return NextResponse.redirect(url);
    }
  }

  // ── 5. Defeat back-forward cache for admins inside /admin ──────────────
  // Without no-store, hitting Back from /admin to a previously visited
  // /dashboard would restore the dashboard page from bfcache and the
  // middleware redirect above wouldn't fire. Forcing revalidation makes
  // every Back hit re-enter middleware so the sticky-admin rule applies.
  if (isAdmin && isAdminRoute) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}
