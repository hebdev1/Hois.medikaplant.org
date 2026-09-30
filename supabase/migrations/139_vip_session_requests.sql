-- 139: VIP (Melis) confidential-session requests. A Melis member asks for a
-- 21-min conversation with Vye Ewòl; it lands as status='nouvo' and staff
-- manage it in /admin/sesyon-vip. Members insert + read their OWN rows;
-- admins manage all (is_admin). Each insert pings the admin bell via the
-- trigger-only notify_admins helper (see 111/117/118/121, 137).

create table if not exists public.vip_session_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  preferred_window text,
  note text,
  status text not null default 'nouvo'
    check (status in ('nouvo','pwograme','fèt','refize')),
  admin_note text,
  handled_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vip_session_requests_status
  on public.vip_session_requests(status, created_at desc);

-- DB backstop: at most one OPEN request per member
create unique index if not exists uniq_vip_session_open
  on public.vip_session_requests(user_id) where status in ('nouvo','pwograme');

alter table public.vip_session_requests enable row level security;

-- member: insert own rows (plan gate is server-side)
drop policy if exists vip_session_requests_insert_own on public.vip_session_requests;
create policy vip_session_requests_insert_own on public.vip_session_requests
  for insert to authenticated with check (user_id = (select auth.uid()));

-- member: read own rows (to show status back)
drop policy if exists vip_session_requests_select_own on public.vip_session_requests;
create policy vip_session_requests_select_own on public.vip_session_requests
  for select to authenticated using (user_id = (select auth.uid()));

-- admins: full manage (no member UPDATE/DELETE policy -> members can't change status)
drop policy if exists vip_session_requests_admin_all on public.vip_session_requests;
create policy vip_session_requests_admin_all on public.vip_session_requests
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- new request -> admin bell + push (reuses trigger-only notify_admins)
create or replace function public.tg_notify_admins_vip_session()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform public.notify_admins(
    'Nouvo demann sesyon VIP',
    'Yon manm Melis mande yon sesyon 21 min ak Vye Ewòl.',
    '/admin/sesyon-vip'
  );
  return new;
exception when others then
  return new;  -- never block the member insert on notify plumbing
end $$;

drop trigger if exists trg_notify_admins_vip_session on public.vip_session_requests;
create trigger trg_notify_admins_vip_session
  after insert on public.vip_session_requests
  for each row execute function public.tg_notify_admins_vip_session();
