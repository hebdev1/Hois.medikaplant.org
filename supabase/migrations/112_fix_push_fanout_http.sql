-- Fix: the push fan-out trigger called extensions.http_post, but on this
-- project pg_net only exposes net.http_post. The call raised "function does not
-- exist", which the trigger's own `exception when others` handler swallowed —
-- so no push was ever delivered, even though notifications were created and the
-- trigger fired. Point it at net.http_post (and add net to the search_path).
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
