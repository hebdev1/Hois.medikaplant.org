import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  // Next.js runs middleware on PREFETCH requests too — every time a visitor
  // hovers a <Link> (the admin sidebar and dashboard nav are full of them),
  // the router quietly prefetches the target, which otherwise re-runs the
  // getUser() auth round-trip + the suspended/role/subscription DB batch
  // below. On a single Hostinger Node process those redundant Supabase
  // round-trips pile up and slow the real navigations. A prefetch never needs
  // the gate: the actual navigation re-runs this middleware, and every gated
  // page also guards itself server-side (redirect on no session). So we let
  // prefetches pass straight through untouched.
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-purpose') === 'prefetch';
  if (isPrefetch) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

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
  // /admin/accept-invite/<token> is publicly reachable so a brand-new
  // invitee can land on it without an existing session, sign up, then
  // consume the invite. We treat it like /admin/login for gating
  // purposes (no auto-redirect either way).
  const isAdminAcceptInvite = pathname.startsWith('/admin/accept-invite');
  // /checkout is intentionally NOT gated here — anonymous visitors must be
  // able to land on the checkout page with their plan choice and complete
  // the login/signup inline while they purchase. Only /dashboard requires a
  // session up front.
  const isMemberRoute = pathname.startsWith('/dashboard');
  // The student area is open to any signed-in course buyer — no active
  // subscription required (courses are independent of plans). It still needs
  // a session, and the pages inside gate on enrolment.
  const isLearnRoute = pathname.startsWith('/aprann');
  const isMemberAuthRoute =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');

  // ── 1. Unauthed visits ─────────────────────────────────────────────────
  if (!user) {
    // /admin/* (except /admin/login and /admin/accept-invite) → /admin/login
    if (isAdminRoute && !isAdminLogin && !isAdminAcceptInvite) {
      const url = request.nextUrl.clone();
      url.search = '';
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    // /dashboard/* → the member login; /aprann/* → the dedicated student login.
    if (isMemberRoute || isLearnRoute) {
      const url = request.nextUrl.clone();
      const originalSearch = request.nextUrl.search;
      const originalPlan = request.nextUrl.searchParams.get('plan');
      url.search = '';
      url.pathname = isLearnRoute ? '/etidyan/login' : '/auth/login';
      url.searchParams.set('redirect', `${pathname}${originalSearch}`);
      if (originalPlan) url.searchParams.set('plan', originalPlan);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── 1. Authorization inputs come from the DB, NEVER user_metadata ──────
  // user_metadata (e.g. app_role) is writable by the user themselves via
  // supabase.auth.updateUser({ data: … }), so it must never drive role or
  // paywall decisions. We read suspended + role from profiles, and — for any
  // member route — the active-subscription count, in one parallel batch to
  // keep the Hostinger→Supabase round-trips down.
  const [profileRes, subRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('suspended, role')
      .eq('id', user.id)
      .maybeSingle(),
    isMemberRoute
      ? supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')
      : Promise.resolve(null),
  ]);

  const profile = profileRes.data as
    | { suspended: boolean | null; role: 'user' | 'admin' | null }
    | null;

  // ── 1b. Suspended members are out, immediately ─────────────────────────
  // Suspending bans the auth account, which blocks new logins and kills token
  // refresh — but an access token already in hand stays valid until it expires
  // (up to an hour). This ends the session on their next page load.
  if (profile?.suspended) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? '/admin/login' : '/auth/login';
    url.search = '?error=suspended';
    return NextResponse.redirect(url);
  }

  // ── 2. Role from the DB (authoritative) ────────────────────────────────
  const role: 'user' | 'admin' = profile?.role === 'admin' ? 'admin' : 'user';
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

  // ── 3. Per-tab isolation: admins are FREE to also browse /dashboard ────
  // We used to bounce every admin visit to /dashboard back to /admin to
  // "keep the admin shell sticky". The side-effect was that running two
  // tabs (admin in one, member dashboard in the other) was impossible —
  // every button click in /dashboard reloaded into /admin because the
  // shared Supabase cookie said "role=admin". Operators want to inspect
  // the live member experience while staying signed in to the admin
  // panel, so we now let admins navigate /dashboard freely. Each browser
  // tab keeps the URL it was on without the middleware second-guessing.
  //
  // Members trying to enter /admin/* still get bounced (next block).

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
    // Already fetched above in the parallel batch (needsSub).
    const count = (subRes as { count: number | null } | null)?.count ?? 0;
    if (count === 0) {
      const url = request.nextUrl.clone();
      url.search = '';
      url.pathname = '/checkout';
      url.searchParams.set('reason', 'no_active_plan');
      return NextResponse.redirect(url);
    }
  }

  return response;
}
