-- 145_spiritual_baths.sql
-- "Beny Spirityèl": admin-managed spiritual-bath recipes in the member
-- "Spirityalite" section. Split in two so the Melis-only part is enforced by
-- RLS, not just by the page:
--   spiritual_baths         the teaser (title, intention, excerpt, photo) —
--                           every signed-in member sees published ones, so
--                           non-Melis members get a locked preview.
--   spiritual_bath_recipes  the recipe itself (ingredients, preparation, how
--                           to bathe, cautions, video) — readable only by
--                           Melis members (profiles.plan = 'vip', the same
--                           source /dashboard/vip and the 141 RPCs use) and
--                           admins.
-- Consumed by /dashboard/beny-spirityel; managed at /admin/beny.

create table if not exists public.spiritual_baths (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  intention       text,
  excerpt         text,
  cover_image_url text,
  display_order   int  not null default 0,
  published       boolean not null default false,
  published_at    timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.spiritual_baths enable row level security;
drop policy if exists spiritual_baths_member_read on public.spiritual_baths;
create policy spiritual_baths_member_read on public.spiritual_baths
  for select to authenticated
  using (published or public.is_admin((select auth.uid())));
drop policy if exists spiritual_baths_admin_all on public.spiritual_baths;
create policy spiritual_baths_admin_all on public.spiritual_baths
  for all to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
grant select on public.spiritual_baths to authenticated;

create table if not exists public.spiritual_bath_recipes (
  bath_id          uuid primary key references public.spiritual_baths(id) on delete cascade,
  ingredients      text[] not null default '{}',
  preparation_html text,
  usage_html       text,
  cautions_html    text,
  video_url        text,
  updated_at       timestamptz not null default now()
);
alter table public.spiritual_bath_recipes enable row level security;
drop policy if exists spiritual_bath_recipes_melis_read on public.spiritual_bath_recipes;
create policy spiritual_bath_recipes_melis_read on public.spiritual_bath_recipes
  for select to authenticated
  using (
    public.is_admin((select auth.uid()))
    or (
      exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid()) and p.plan = 'vip'
      )
      and exists (
        select 1 from public.spiritual_baths b
        where b.id = bath_id and b.published
      )
    )
  );
drop policy if exists spiritual_bath_recipes_admin_all on public.spiritual_bath_recipes;
create policy spiritual_bath_recipes_admin_all on public.spiritual_bath_recipes
  for all to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
grant select on public.spiritual_bath_recipes to authenticated;

create index if not exists spiritual_baths_published_order_idx
  on public.spiritual_baths (published, display_order);
