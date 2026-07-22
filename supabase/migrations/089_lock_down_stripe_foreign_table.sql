-- Close public API access to the Stripe checkout-sessions foreign table.
--
-- The Stripe wrapper was set up with its foreign table in the `public`
-- schema, which PostgREST exposes. `anon` and `authenticated` both held
-- SELECT, so anyone holding the publishable anon key (it ships in the
-- website's client JS) could read Stripe checkout sessions — customer
-- emails, amounts, payment status — straight from the REST API.
--
-- Nothing in the application reads this table (there is no Stripe code in
-- the app at all), so revoking is safe. It was still empty when this was
-- applied, so nothing leaked; this closes the hole before the first real
-- payment.
--
-- Foreign tables do not enforce RLS the way ordinary tables do, so removing
-- the grants — not adding a policy — is the correct control here.

revoke all on table public.checkout from anon, authenticated;

-- Keep future wrapper tables from inheriting access by default.
alter default privileges in schema public revoke all on tables from anon;
