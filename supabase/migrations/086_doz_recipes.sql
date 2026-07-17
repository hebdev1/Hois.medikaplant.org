-- Migration 086: "Resèt ak Dòz" — a Guides-style content type with its own
-- categories and admin CRUD. Recipes carry a rich HTML body rendered inside
-- the platform (like /dashboard/guides/[slug]).

create table if not exists public.doz_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doz_recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body_html text,
  category_id uuid references public.doz_categories(id) on delete set null,
  tag text,
  cover_image_url text,
  published boolean not null default false,
  published_at timestamptz,
  view_count int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doz_recipes_category_idx on public.doz_recipes(category_id);
create index if not exists doz_recipes_published_idx on public.doz_recipes(published, published_at desc);

alter table public.doz_categories enable row level security;
alter table public.doz_recipes enable row level security;

-- Categories: readable by anyone; only admins write.
drop policy if exists doz_categories_public_read on public.doz_categories;
create policy doz_categories_public_read on public.doz_categories for select using (true);
drop policy if exists doz_categories_admin_all on public.doz_categories;
create policy doz_categories_admin_all on public.doz_categories for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Recipes: published ones public; admins see + manage everything.
drop policy if exists doz_recipes_public_read on public.doz_recipes;
create policy doz_recipes_public_read on public.doz_recipes for select
  using (published = true or public.is_admin(auth.uid()));
drop policy if exists doz_recipes_admin_all on public.doz_recipes;
create policy doz_recipes_admin_all on public.doz_recipes for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
