-- Laboratwa "Maladi & Plant" (replaces the Konbinezon tool): condition
-- categories with TRAMIL-recommended plants. Per-condition plant list is JSONB
-- (display-only, edited as a group in admin): {name_kr, sci, prep, tramil, slug?}.
-- Source: TRAMIL Caribbean Herbal Pharmacopoeia. Shown as documented
-- preparations (not a personal dose), with red-flags + disclaimer.

create table if not exists public.lab_conditions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_kr text not null,
  intro_kr text,
  red_flag_kr text,
  doctor_limit_kr text,
  doctor_attention_kr text,
  plants jsonb not null default '[]'::jsonb,
  display_order int not null default 0,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lab_conditions enable row level security;
drop policy if exists "public read published lab_conditions" on public.lab_conditions;
create policy "public read published lab_conditions" on public.lab_conditions
  for select using (status = 'published');
drop policy if exists "admins manage lab_conditions" on public.lab_conditions;
create policy "admins manage lab_conditions" on public.lab_conditions
  for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
grant select on public.lab_conditions to anon, authenticated;

-- Seed content is the TRAMIL guide (6 conditions). It is applied in the live
-- DB and is admin-editable thereafter; see the app for the authoritative copy.
