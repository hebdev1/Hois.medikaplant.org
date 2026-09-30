-- 140: In-app consultation booking (Melis benefit, free).
--
-- Admin publishes available SLOTS; a Melis member books one (pending); the admin
-- validates it (confirmed) or reschedules it (reschedule_proposed) -> the member
-- must ACCEPT (confirmed) or decline (declined -> pick again). The member is
-- notified on validate/reschedule.
--
-- Mirrors 106_course_sessions (admin creates timed rows, members can't write —
-- every member mutation runs through the service role after an ownership
-- re-check in the server action) + 139_vip_session_requests (text+CHECK status,
-- own-row SELECT, admin-all, swallow-safe notify_admins trigger). The Melis plan
-- gate is enforced server-side in the actions (members have no write policy here
-- at all, so a direct client can't create a booking).

-- ── consultation_slots: admin availability (a slot exists before anyone books it)
create table if not exists public.consultation_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  duration_minutes int not null default 30,
  modality text not null default 'video' check (modality in ('video','phone','in_person')),
  consultant_name text,
  status text not null default 'open' check (status in ('open','booked','blocked')),
  timezone text not null default 'America/Port-au-Prince',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_consultation_slots_open
  on public.consultation_slots(status, starts_at);

-- ── consultation_bookings: a member's booking of a slot + reschedule-accept lifecycle
create table if not exists public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_id uuid not null references public.consultation_slots(id) on delete restrict,
  -- set only while a reschedule is pending the member's acceptance
  proposed_slot_id uuid references public.consultation_slots(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','reschedule_proposed','declined','cancelled','completed','no_show')),
  scheduled_at timestamptz,        -- denormalized from the agreed slot at confirm (GDPR/PDF + history)
  topic text,
  note text,
  meeting_url text,                -- admin sets on confirm
  consultant_name text,
  admin_note text,
  handled_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_consultation_bookings_user
  on public.consultation_bookings(user_id, created_at desc);
create index if not exists idx_consultation_bookings_status
  on public.consultation_bookings(status, created_at desc);
-- one ACTIVE booking per member (race backstop; mirrors 139 uniq_vip_session_open)
create unique index if not exists uniq_consultation_booking_open
  on public.consultation_bookings(user_id)
  where status in ('pending','confirmed','reschedule_proposed');

alter table public.consultation_slots    enable row level security;
alter table public.consultation_bookings enable row level security;

-- slots: members read non-blocked slots (a slot carries no PII); admins manage all.
-- No member write -> the open->booked flip runs via the service role in the action.
drop policy if exists consultation_slots_select on public.consultation_slots;
create policy consultation_slots_select on public.consultation_slots
  for select to authenticated
  using (status <> 'blocked' or public.is_admin((select auth.uid())));
drop policy if exists consultation_slots_admin_all on public.consultation_slots;
create policy consultation_slots_admin_all on public.consultation_slots
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- bookings: member reads OWN rows; admins manage all. No member INSERT/UPDATE/DELETE
-- -> book/accept/decline/cancel all run via the service role after the action
-- re-checks ownership + the Melis plan (getSessionJoinLink / course_sessions ethos).
drop policy if exists consultation_bookings_select_own on public.consultation_bookings;
create policy consultation_bookings_select_own on public.consultation_bookings
  for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists consultation_bookings_admin_all on public.consultation_bookings;
create policy consultation_bookings_admin_all on public.consultation_bookings
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- new booking -> admin bell + push (reuses trigger-only notify_admins; mirrors
-- 139 trg_notify_admins_vip_session). Swallow-safe so notify plumbing can never
-- block the member's booking insert.
create or replace function public.tg_notify_admins_consultation()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.notify_admins(
    'Nouvo demann konsiltasyon',
    'Yon manm Melis chwazi yon kreno konsiltasyon.',
    '/admin/konsiltasyon'
  );
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_notify_admins_consultation on public.consultation_bookings;
create trigger trg_notify_admins_consultation
  after insert on public.consultation_bookings
  for each row execute function public.tg_notify_admins_consultation();
