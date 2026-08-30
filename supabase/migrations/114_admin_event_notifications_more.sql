-- More admin push events (extends migration 111). Adds a notification per admin
-- when a member:
--   • buys a subscription plan (a real Stripe sub, not an admin grant)
--   • opens a forum topic or posts a forum reply
--   • asks a question on a course
-- Reuses notify_admins() + the notifications → push fan-out. All fail open.

-- ── Subscription plan purchase ───────────────────────────────────────────────
-- Real purchases carry a Stripe reference; admin grants use amount 0 or a
-- payment_reference like 'admin_...'. Notify only on genuine paid subs.
create or replace function public.tg_notify_admins_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active'
     and new.amount > 0
     and coalesce(new.payment_reference, '') not like 'admin\_%'
  then
    perform public.notify_admins(
      'Nouvo abònman',
      'Yon manm fèk pran yon abònman ' || coalesce(new.plan::text, '') || '.',
      '/admin/subscriptions'
    );
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_subscription on public.subscriptions;
create trigger trg_notify_admins_subscription
  after insert on public.subscriptions
  for each row execute function public.tg_notify_admins_subscription();

-- ── Forum: new topic ─────────────────────────────────────────────────────────
-- Only member-authored posts notify (skip an admin's own forum activity).
create or replace function public.tg_notify_admins_forum_topic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and role = 'user') then
    perform public.notify_admins(
      'Nouvo sijè fowòm',
      'Yon manm louvri yon nouvo sijè: ' || left(coalesce(new.title, ''), 80),
      '/admin/forum'
    );
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_forum_topic on public.forum_topics;
create trigger trg_notify_admins_forum_topic
  after insert on public.forum_topics
  for each row execute function public.tg_notify_admins_forum_topic();

-- ── Forum: new reply ─────────────────────────────────────────────────────────
create or replace function public.tg_notify_admins_forum_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and role = 'user') then
    perform public.notify_admins(
      'Nouvo repons fowòm',
      'Yon manm reponn nan yon sijè fowòm.',
      '/admin/forum'
    );
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_forum_reply on public.forum_replies;
create trigger trg_notify_admins_forum_reply
  after insert on public.forum_replies
  for each row execute function public.tg_notify_admins_forum_reply();

-- ── Course question ──────────────────────────────────────────────────────────
create or replace function public.tg_notify_admins_course_question()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_admins(
    'Nouvo kesyon sou yon kou',
    'Yon manm poze yon kesyon sou yon kou — li tann yon repons.',
    '/admin/kesyon'
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_course_question on public.course_questions;
create trigger trg_notify_admins_course_question
  after insert on public.course_questions
  for each row execute function public.tg_notify_admins_course_question();
