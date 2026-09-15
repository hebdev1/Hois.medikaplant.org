-- 131_site_chrome.sql
-- Site chrome: navigation menus + header/footer settings driving the public
-- header, footer, and announcement bar. Public-readable (anon) so the chrome
-- renders without auth; admin-only writes. Consumed by lib/site-chrome.ts.

create table if not exists public.nav_items (
  id             uuid primary key default gen_random_uuid(),
  location       text not null check (location in ('header','footer')),
  group_title    text,                          -- footer column heading (null for header)
  label          text not null,
  url            text not null default '#',
  target         text not null default '_self' check (target in ('_self','_blank')),
  display_order  int  not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.nav_items enable row level security;
drop policy if exists nav_items_admin_all on public.nav_items;
create policy nav_items_admin_all on public.nav_items
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists nav_items_anon_read on public.nav_items;
create policy nav_items_anon_read on public.nav_items
  for select to anon using (active);
grant select on public.nav_items to anon;

create table if not exists public.site_settings (
  id                     int primary key default 1,
  announcement_active    boolean not null default false,
  announcement_text      text,
  announcement_cta_label text,
  announcement_cta_href  text,
  footer_tagline         text,
  social_facebook        text,
  social_instagram       text,
  social_youtube         text,
  social_email           text,
  updated_by             uuid references auth.users(id) on delete set null,
  updated_at             timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);
alter table public.site_settings enable row level security;
drop policy if exists site_settings_admin_all on public.site_settings;
create policy site_settings_admin_all on public.site_settings
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists site_settings_anon_read on public.site_settings;
create policy site_settings_anon_read on public.site_settings
  for select to anon using (true);
grant select on public.site_settings to anon;
