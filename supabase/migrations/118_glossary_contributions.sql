-- Community contributions to the glossary. Anyone visiting /glose can propose
-- a local name, flag that a name means a different plant in their area, or
-- report a correction — with photos + location. A curator approves each one in
-- /admin/glose/kontribisyon before anything is applied to the glossary.
--
-- Public submissions are written by the service-role submit action (which
-- validates + shapes the row), so RLS exposes the table to admins only; there
-- is intentionally no anon policy.

create table if not exists public.glossary_contributions (
  id uuid primary key default gen_random_uuid(),
  plant_id text,                 -- GLOS-xxxx when the plant is in the glossary
  plant_not_in_list text,        -- the name when it is NOT in the glossary
  plant_name text not null,      -- kreyòl name as submitted
  plant_scientific text,
  kind text not null check (kind in ('lot-non','diferan','koreksyon')),
  proposed_name text,
  note text,
  department_code text,
  commune text,
  locality text,
  knowledge_source text,
  photo_confirmation text check (photo_confirmation in ('wi','non','pa-si')),
  photos text[] not null default '{}',
  contributor_name text,
  contributor_contact text,
  allow_cite boolean not null default false,
  status text not null default 'nouvo' check (status in ('nouvo','apwouve','rejte')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists idx_glose_contrib_status
  on public.glossary_contributions(status, created_at desc);

alter table public.glossary_contributions enable row level security;

drop policy if exists "admins manage glossary_contributions" on public.glossary_contributions;
create policy "admins manage glossary_contributions"
  on public.glossary_contributions for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- New contribution → admin bell + push (reuses notify_admins).
create or replace function public.tg_notify_admins_contribution()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform public.notify_admins(
    'Nouvo kontribisyon glosè',
    'Yon moun pwopoze yon enfòmasyon sou plant «' || coalesce(new.plant_name, '') || '».',
    '/admin/glose/kontribisyon'
  );
  return new;
exception when others then
  return new;
end;
$function$;

drop trigger if exists trg_notify_admins_contribution on public.glossary_contributions;
create trigger trg_notify_admins_contribution
  after insert on public.glossary_contributions
  for each row execute function public.tg_notify_admins_contribution();
