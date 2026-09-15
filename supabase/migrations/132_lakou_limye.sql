-- 132_lakou_limye.sql
-- "Lakou Limyè": a member hub of admin-managed tabs. Each tab holds content
-- (videos / audio / articles) assigned per-item via lakou_tab_id. Tabs are
-- member-readable when active; admin-writable. Consumed by
-- /dashboard/lakou-limye; managed at /admin/lakou.

create table if not exists public.lakou_tabs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  display_order int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.lakou_tabs enable row level security;
drop policy if exists lakou_tabs_read on public.lakou_tabs;
create policy lakou_tabs_read on public.lakou_tabs for select using (active);
drop policy if exists lakou_tabs_admin_all on public.lakou_tabs;
create policy lakou_tabs_admin_all on public.lakou_tabs
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
grant select on public.lakou_tabs to anon, authenticated;

alter table public.cms_videos   add column if not exists lakou_tab_id uuid references public.lakou_tabs(id) on delete set null;
alter table public.resources    add column if not exists lakou_tab_id uuid references public.lakou_tabs(id) on delete set null;
alter table public.cms_articles add column if not exists lakou_tab_id uuid references public.lakou_tabs(id) on delete set null;

insert into public.lakou_tabs (name, slug, display_order) values
  ('Salon Mistik',      'salon-mistik',      1),
  ('Emisyon Spirityèl', 'emisyon-spirityel', 2),
  ('Pakou Limyè',       'pakou-limye',       3)
on conflict (slug) do nothing;

-- Carry over the current "Salon" (which showed all videos) into "Emisyon Spirityèl".
update public.cms_videos
set lakou_tab_id = (select id from public.lakou_tabs where slug = 'emisyon-spirityel')
where lakou_tab_id is null;
