-- 143: Give the push fan-out POST more time before pg_net gives up.
--
-- net.http_post defaults to a 5000ms timeout. On Hostinger's latency floor,
-- a fan-out that sends Web Push to several devices can take longer than that,
-- so pg_net recorded `timed_out=true` and the request looked failed (even
-- though healthy devices still received their push). The route itself now caps
-- each individual send (lib/push/send.ts) and fans out to recipients in
-- parallel (api/push/fanout), so it responds quickly — this just widens the
-- pg_net window to 20s as margin. Otherwise identical to 112.
create or replace function public.notify_push_fanout()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'net'
as $function$
declare
  v_secret text := public._app_cron_secret();
  v_url    text := public._app_site_url();
begin
  if v_secret = '' then return new; end if;

  perform net.http_post(
    url                  := v_url || '/api/push/fanout',
    body                 := jsonb_build_object('notification_id', new.id),
    headers              := jsonb_build_object(
                              'Content-Type',  'application/json',
                              'Authorization', 'Bearer ' || v_secret
                            ),
    timeout_milliseconds := 20000
  );
  return new;
exception when others then
  -- Never break notification creation because push plumbing failed.
  return new;
end$function$;
