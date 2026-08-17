-- Fire a Web Push fan-out whenever a notification is created. Mirrors the
-- badge-unlock trigger: uses the shared cron secret + site URL helpers, fails
-- open (never blocks the notification insert), and posts the new row's id to
-- the CRON_SECRET-guarded /api/push/fanout route, which resolves recipients
-- and pushes to their devices.
create or replace function public.notify_push_fanout()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_secret text := public._app_cron_secret();
  v_url    text := public._app_site_url();
begin
  if v_secret = '' then return new; end if;

  perform extensions.http_post(
    url     := v_url || '/api/push/fanout',
    body    := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_secret
               )
  );
  return new;
exception when others then
  -- Never break notification creation because push plumbing failed.
  return new;
end$function$;

drop trigger if exists trg_notify_push_fanout on public.notifications;
create trigger trg_notify_push_fanout
  after insert on public.notifications
  for each row execute function public.notify_push_fanout();
