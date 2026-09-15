-- 124_cms_pages.sql
-- CMS Pages: block-built pages editable in /admin/pages and rendered publicly
-- at /paj/<slug>. `blocks` is an ordered JSON array of {id,type,...fields}.
-- Admins manage everything; the public may read only PUBLISHED pages.

create table if not exists public.cms_pages (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  status          text not null default 'draft' check (status in ('draft','published')),
  blocks          jsonb not null default '[]'::jsonb,
  seo_title       text,
  seo_description text,
  og_image        text,
  created_by      uuid references auth.users(id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists cms_pages_status_idx on public.cms_pages (status);

alter table public.cms_pages enable row level security;

-- Admins: full control.
drop policy if exists cms_pages_admin_all on public.cms_pages;
create policy cms_pages_admin_all on public.cms_pages
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Everyone: read published pages only (powers the public /paj/<slug> renderer).
drop policy if exists cms_pages_public_read on public.cms_pages;
create policy cms_pages_public_read on public.cms_pages
  for select to anon, authenticated
  using (status = 'published');

-- RLS is necessary but not sufficient for anon reads — the role also needs the
-- table grant (same pattern as the other public content tables).
grant select on public.cms_pages to anon;
