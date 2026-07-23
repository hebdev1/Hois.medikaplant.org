-- Close public API access to the HubSpot foreign table.
--
-- Like the Stripe wrapper (migration 089), the HubSpot wrapper's foreign
-- table landed in `public`, which PostgREST exposes, and `anon` held SELECT.
-- The publishable anon key ships in the website's client JS, so anyone could
-- read HubSpot CRM data (member contacts, emails, names) straight from the
-- REST API. Nothing in the app reads this table directly — HubSpot sync goes
-- through the server-side lib/hubspot code with its own token — so revoking
-- is safe.

revoke all on table public.hubspot from anon, authenticated;
