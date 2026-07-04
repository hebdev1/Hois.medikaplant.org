-- Migration 076 — Remèd Finder widget schema (Phase 1 of the roadmap).
--
-- Three tables power the keyword → product suggestion widget:
--   conditions          — health conditions / symptom groups + keywords
--   shop_products       — mirror of the medikaplantshop.com catalog
--   condition_products  — junction with per-condition ranking
--
-- NAMING NOTE: the roadmap specified `public.products`, but that table
-- already exists in this project (dashboard featured-products). The shop
-- mirror is therefore named `shop_products`; everything else follows the
-- roadmap verbatim.
--
-- SECURITY MODEL: public read-only via RLS. No insert/update/delete
-- policies exist for anon or authenticated — all writes go through
-- service_role (server-side seeds + future admin page).

-- ─── conditions ────────────────────────────────────────────────────────────
create table if not exists public.conditions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ht text not null,
  name_fr text not null,
  name_en text not null,
  -- all searchable terms, 3 languages, unaccented lowercase
  keywords text[] not null default '{}',
  emoji text,                                 -- for the popular-condition chips
  is_featured boolean not null default false, -- shown as a quick chip
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

-- ─── shop_products ─────────────────────────────────────────────────────────
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  wc_id int unique not null,                 -- WooCommerce product ID
  name text not null,
  slug text,
  product_type text not null check (product_type in ('simple','variable','bundle')),
  price_min numeric(10,2),
  price_max numeric(10,2),
  currency text not null default 'USD',
  image_url text,
  shop_url text not null,
  short_benefit_ht text,                     -- 1-line Kreyòl benefit for the card
  in_stock boolean not null default true,
  categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── condition_products (junction) ─────────────────────────────────────────
create table if not exists public.condition_products (
  condition_id uuid not null references public.conditions(id) on delete cascade,
  product_id uuid not null references public.shop_products(id) on delete cascade,
  priority int not null default 10,          -- 1 = primary recommendation
  note text,                                 -- internal note (why this mapping)
  primary key (condition_id, product_id)
);

-- ─── Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_conditions_keywords
  on public.conditions using gin (keywords);
create index if not exists idx_shop_products_categories
  on public.shop_products using gin (categories);
create index if not exists idx_cp_condition
  on public.condition_products (condition_id, priority);

-- ─── RLS (strict: public read, service-role-only writes) ──────────────────
alter table public.conditions enable row level security;
alter table public.shop_products enable row level security;
alter table public.condition_products enable row level security;

drop policy if exists "public read conditions" on public.conditions;
create policy "public read conditions"
  on public.conditions for select using (true);

drop policy if exists "public read shop products" on public.shop_products;
create policy "public read shop products"
  on public.shop_products for select using (true);

drop policy if exists "public read mappings" on public.condition_products;
create policy "public read mappings"
  on public.condition_products for select using (true);

-- Deliberately NO insert/update/delete policies for anon or authenticated.
-- service_role bypasses RLS, which is the only write path.

-- ─── Defense-in-depth: revoke write grants outright ────────────────────────
-- (applied as migration 077 in the live DB) RLS already blocks writes, but
-- revoking the default Supabase DML grants means even an accidentally-added
-- permissive policy could not open a write path for anon/authenticated.
revoke insert, update, delete on public.conditions from anon, authenticated;
revoke insert, update, delete on public.shop_products from anon, authenticated;
revoke insert, update, delete on public.condition_products from anon, authenticated;
