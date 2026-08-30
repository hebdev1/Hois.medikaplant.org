-- Same fix as 112, for the badge-unlock trigger: it also called
-- extensions.http_post (which doesn't exist here) and swallowed the error, so
-- badge-unlock emails never fired. Point it at net.http_post.
create or replace function public.notify_badge_unlock()
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
    url     := v_url || '/api/webhooks/badge-unlocked',
    body    := jsonb_build_object(
                 'user_id',  new.user_id,
                 'badge_id', new.badge_id
               ),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_secret
               )
  );
  return new;
exception when others then
  return new;
end$function$;
