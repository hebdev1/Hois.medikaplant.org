-- Laboratwa Faz 5: community contributions. Anyone can propose a local name /
-- note / photo for a plant; it lands as status='draft' and a curator reviews it
-- in /admin/laboratwa/kontribisyon before anything is published. Public writes
-- go through the service-role submit action, so RLS exposes the table to admins
-- only (no anon policy). Each new row pings the admin bell via notify_admins.

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references public.plants(id) on delete set null,
  local_name text,
  region text,
  body text,
  photo_path text,
  status text not null default 'draft' check (status in ('draft','published','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists idx_contributions_status on public.contributions(status, created_at desc);

alter table public.contributions enable row level security;

drop policy if exists "admins manage contributions" on public.contributions;
create policy "admins manage contributions" on public.contributions for all
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

create or replace function public.tg_notify_admins_lab_contribution()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  perform public.notify_admins(
    'Nouvo kontribisyon Laboratwa',
    'Yon moun pataje yon non lokal oswa yon nòt sou yon plant.',
    '/admin/laboratwa/kontribisyon'
  );
  return new;
exception when others then return new;
end;
$function$;

drop trigger if exists trg_notify_admins_lab_contribution on public.contributions;
create trigger trg_notify_admins_lab_contribution
  after insert on public.contributions
  for each row execute function public.tg_notify_admins_lab_contribution();
