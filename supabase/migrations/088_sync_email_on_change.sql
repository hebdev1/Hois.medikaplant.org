-- Keep public.profiles.email in step with auth.users.email.
--
-- Members can now change their account email from the settings page. Supabase
-- updates auth.users.email once the confirmation link is clicked, but nothing
-- was syncing that back to profiles.email — the copy the app actually reads and
-- ships to HubSpot. Without this, a confirmed change would leave the profile
-- (and the settings screen) showing the old address forever.

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Only touch the row when the address really changed.
  if new.email is distinct from old.email then
    update public.profiles
       set email = new.email
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  execute function public.sync_profile_email();
