-- Security hardening (audit 2026-08-04).
--
-- 1. HIGH — the Stripe FDW `checkout` foreign table ignores RLS (foreign tables
--    always do). The `authenticated` role had SELECT on it, so any logged-in
--    user could read every customer's Stripe checkout data over the REST/GraphQL
--    API. Revoke it. (Mirrors migrations 089/091 that locked down the other
--    stripe/hubspot foreign tables — `checkout` was missed.)
revoke select on public.checkout from authenticated, anon;

-- 2. LOW / defense-in-depth — these tables are already RLS-gated to
--    admins/super-admins/service-role, but a leftover `anon` SELECT grant kept
--    them discoverable in the auto-generated API schema. Anon has no legitimate
--    read path to any of them, so drop the grant. `authenticated` is kept: admins
--    read these as the authenticated role, gated by their RLS policies.
revoke select on public.admin_invites from anon;
revoke select on public.app_config from anon;
revoke select on public.contact_messages from anon;
