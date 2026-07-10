import { cache } from 'react';
import { createClient } from './server';

/**
 * Request-scoped, de-duplicated current user.
 *
 * React's cache() memoizes the result for the lifetime of a single server
 * render. Every dashboard navigation renders the page AND the <Topbar> it
 * contains (and, on a full load, the layout too) — each of which needs the
 * signed-in user. Before this, they each fired their own
 * supabase.auth.getUser(), which is a network round-trip to Supabase Auth
 * (us-west-2) — so a single dashboard load paid for 2–3 serial auth
 * validations. Routing every server component through getCurrentUser()
 * collapses them to ONE call per request.
 *
 * Server ACTIONS (mutations) intentionally keep their own getUser() call —
 * they run in separate requests, are not part of the render tree, and each
 * needs its own fresh validation.
 */
export const getCurrentUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
