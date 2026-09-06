-- Laboratwa Faz 1: the plants data model. A plant is not a product (some
-- plants aren't sold; some products contain several plants), so this is its own
-- table, separate from shop_products and from the glossary_terms reader.
--
-- Public read is limited to status='published'; the array columns get GIN
-- indexes because the Eksplorate filters on parts_used / preparations /
-- season_months / regions. New tables also need an explicit anon grant here
-- (separate from RLS) for the public laboratwa to read them.

create table if not exists public.plants (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name_kr       text not null,
  name_fr       text,
  name_en       text,
  name_sci      text not null,
  family        text,
  parts_used    text[] not null default '{}',
  preparations  text[] default '{}',
  season_months smallint[] default '{}',
  regions       text[] default '{}',
  summary_kr    text,
  support_kr    text,
  cautions_kr   text[] default '{}',
  photos        jsonb default '{}'::jsonb,
  status        text not null default 'draft' check (status in ('draft','published')),
  created_at    timestamptz not null default now()
);

create table if not exists public.plant_conditions (
  plant_id     uuid not null references public.plants(id) on delete cascade,
  condition_id uuid not null references public.conditions(id) on delete cascade,
  primary key (plant_id, condition_id)
);

create table if not exists public.plant_recipes (
  plant_id  uuid not null references public.plants(id) on delete cascade,
  recipe_id uuid not null references public.doz_recipes(id) on delete cascade,
  primary key (plant_id, recipe_id)
);

create index if not exists idx_plants_status  on public.plants(status);
create index if not exists idx_plants_parts    on public.plants using gin(parts_used);
create index if not exists idx_plants_preps     on public.plants using gin(preparations);
create index if not exists idx_plants_season   on public.plants using gin(season_months);
create index if not exists idx_plants_regions  on public.plants using gin(regions);
create index if not exists idx_pc_condition on public.plant_conditions(condition_id);
create index if not exists idx_pr_recipe    on public.plant_recipes(recipe_id);

alter table public.plants enable row level security;
alter table public.plant_conditions enable row level security;
alter table public.plant_recipes enable row level security;

drop policy if exists "public read published plants" on public.plants;
create policy "public read published plants" on public.plants
  for select using (status = 'published');
drop policy if exists "admins manage plants" on public.plants;
create policy "admins manage plants" on public.plants
  for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

drop policy if exists "public read plant_conditions" on public.plant_conditions;
create policy "public read plant_conditions" on public.plant_conditions for select using (true);
drop policy if exists "admins manage plant_conditions" on public.plant_conditions;
create policy "admins manage plant_conditions" on public.plant_conditions
  for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

drop policy if exists "public read plant_recipes" on public.plant_recipes;
create policy "public read plant_recipes" on public.plant_recipes for select using (true);
drop policy if exists "admins manage plant_recipes" on public.plant_recipes;
create policy "admins manage plant_recipes" on public.plant_recipes
  for all using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

grant select on public.plants, public.plant_conditions, public.plant_recipes to anon, authenticated;
