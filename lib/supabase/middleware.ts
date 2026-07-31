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

  // ── Authed: gather every per-request read in ONE parallel batch ────────
  // Hostinger→Supabase round-trips dominate dashboard navigation, so we pay
  // that latency once (Promise.all) instead of firing these checks one after
  // another. Same reads, same rules — just not sequential:
  //   • suspended — always (closes the suspend→token-still-valid window)
  //   • role — only when the JWT claim didn't carry it (pre-hook sessions)
  //   • active subscription — only for a member (non-admin) on /dashboard
  const metadataRole = (user.user_metadata as { app_role?: string } | null)
    ?.app_role;
  const roleInJwt = metadataRole === 'admin' || metadataRole === 'user';
  const isAdminFromJwt = metadataRole === 'admin';
  // When the JWT lacks the claim we can't yet know admin-ness, so fetch the
  // subscription for any member route and simply ignore it if the DB role
  // turns out to be admin.
  const needsSub = isMemberRoute && !isAdminFromJwt;

  const [suspendedRes, roleRes, subRes] = await Promise.all([
    supabase.from('profiles').select('suspended').eq('id', user.id).maybeSingle(),
    roleInJwt
      ? Promise.resolve(null)
      : supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    needsSub
      ? supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')
      : Promise.resolve(null),
  ]);

  // ── 1b. Suspended members are out, immediately ─────────────────────────
  // Suspending bans the auth account, which blocks new logins and kills
  // token refresh — but an access token already in hand stays valid until it
  // expires (up to an hour). This check closes that window: the moment an
  // admin suspends someone, their next page load ends the session.
  if ((suspendedRes?.data as { suspended: boolean } | null)?.suspended) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? '/admin/login' : '/auth/login';
    url.search = '?error=suspended';
    return NextResponse.redirect(url);
  }

  // ── 2. Role: JWT claim (fast, no round-trip) or the DB fallback above ──
  //    The fallback only fires for sessions issued BEFORE the access-token
  //    hook was enabled; once the user signs in again we hit the fast path.
  let role: 'user' | 'admin' = 'user';
  if (roleInJwt) {
    role = metadataRole as 'user' | 'admin';
  } else {
    role = (roleRes?.data as { role: 'user' | 'admin' } | null)?.role ?? 'user';
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
