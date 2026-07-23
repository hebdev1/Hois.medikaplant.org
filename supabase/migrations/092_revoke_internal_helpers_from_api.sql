-- Stop exposing internal DB helpers through the public API.
--
-- _app_cron_secret() returns the cron secret from app_config, and _app_site_url()
-- returns the site URL. They exist so DB-side pg_cron jobs can read those values
-- when calling the app's cron routes. Functions in the `public` schema that a
-- role can EXECUTE are exposed by PostgREST as RPC endpoints, and EXECUTE was
-- granted to PUBLIC by default — so anyone holding the publishable anon key
-- could POST /rest/v1/rpc/_app_cron_secret and read the cron secret, then hit
-- the cron endpoints themselves.
--
-- pg_cron runs these as a privileged role, not anon/authenticated, so revoking
-- API-role access does not affect the scheduled jobs.

revoke execute on function public._app_cron_secret() from public, anon, authenticated;
revoke execute on function public._app_site_url()   from public, anon, authenticated;
