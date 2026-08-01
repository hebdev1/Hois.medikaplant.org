-- Daily reminders: pg_cron pings /api/cron/reminders each morning (13:00 UTC =
-- ~9am Haiti). That endpoint creates in-app reminder notifications for
-- treatment adherence + a health-log nudge. Reuses the same _app_site_url() /
-- _app_cron_secret() helpers as the other cron jobs. Idempotent.
do $$
begin
  perform cron.unschedule('hois_daily_reminders');
exception when others then
  null;
end $$;

select cron.schedule(
  'hois_daily_reminders',
  '0 13 * * *',
  $job$
  select extensions.http_post(
    url     := public._app_site_url() || '/api/cron/reminders',
    body    := '{}'::jsonb,
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || public._app_cron_secret()
               )
  )
  where public._app_cron_secret() <> ''
  $job$
);
