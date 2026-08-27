-- Admin push notifications. When a key member-driven event happens, create one
-- in-app notification per admin; the existing notifications → push fan-out
-- trigger (109) then delivers a Web Push to each admin's devices. Events:
--   • a new SUPPORT chat message from a member (sender_role = 'user')
--   • a new PAID course purchase
--   • a new member signup (profiles row with role = 'user')
--
-- All functions are SECURITY DEFINER so they run even when the triggering
-- action was taken by a low-privilege member (RLS would otherwise block an
-- insert of a notification addressed to someone else).

-- Insert one notification row per admin.
create or replace function public.notify_admins(
  p_title text,
  p_message text,
  p_link text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (title, message, target, target_user_id, link_url, created_by)
  select p_title, p_message, 'user', pr.id, p_link, null
  from public.profiles pr
  where pr.role = 'admin';
end;
$$;

-- ── Support: a member sent a chat message ────────────────────────────────────
create or replace function public.tg_notify_admins_support()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_role = 'user' then
    perform public.notify_admins(
      'Nouvo mesaj sipò',
      'Yon manm voye yon mesaj nan chat sipò a.',
      '/admin/support'
    );
  end if;
  return new;
exception when others then
  -- Never block the member's action because admin-notify plumbing failed.
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_support on public.support_messages;
create trigger trg_notify_admins_support
  after insert on public.support_messages
  for each row execute function public.tg_notify_admins_support();

-- ── Purchase: a member bought a course ───────────────────────────────────────
create or replace function public.tg_notify_admins_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' then
    perform public.notify_admins(
      'Nouvo acha kou',
      'Yon manm fèk achte yon kou.',
      '/admin/subscriptions'
    );
  end if;
  return new;
exception when others then
  -- Never block the member's action because admin-notify plumbing failed.
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_purchase on public.course_purchases;
create trigger trg_notify_admins_purchase
  after insert on public.course_purchases
  for each row execute function public.tg_notify_admins_purchase();

-- ── Signup: a new member account was created ─────────────────────────────────
create or replace function public.tg_notify_admins_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'user' then
    perform public.notify_admins(
      'Nouvo enskripsyon',
      'Yon nouvo manm fèk kreye yon kont.',
      '/admin/users'
    );
  end if;
  return new;
exception when others then
  -- Never block the member's action because admin-notify plumbing failed.
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_signup on public.profiles;
create trigger trg_notify_admins_signup
  after insert on public.profiles
  for each row execute function public.tg_notify_admins_signup();
