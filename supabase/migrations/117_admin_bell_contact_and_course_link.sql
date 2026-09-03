-- Admin notification bell: complete the coverage.
--
-- 1. Contact-form messages now notify admins too, so they appear in the admin
--    bell's event feed (and fire a push) like every other member action.
-- 2. The course-purchase notification linked to /admin/subscriptions, where
--    courses do NOT appear — clicking it led nowhere useful. Point it at
--    /admin/klas, where course sales live.

-- 1. Contact-form → admin notification -------------------------------------
create or replace function public.tg_notify_admins_contact()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform public.notify_admins(
    'Nouvo mesaj kontak',
    'Yon moun voye yon mesaj nan fòm kontak la.',
    '/admin/contact'
  );
  return new;
exception when others then
  return new;
end;
$function$;

drop trigger if exists trg_notify_admins_contact on public.contact_messages;
create trigger trg_notify_admins_contact
  after insert on public.contact_messages
  for each row execute function public.tg_notify_admins_contact();

-- 2. Course-purchase notification → point at /admin/klas -------------------
create or replace function public.tg_notify_admins_purchase()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = 'paid' then
    perform public.notify_admins(
      'Nouvo acha kou',
      'Yon manm fèk achte yon kou.',
      '/admin/klas'
    );
  end if;
  return new;
exception when others then
  return new;
end;
$function$;
