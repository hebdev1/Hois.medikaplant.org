-- 126_cms_articles.sql
-- CMS Articles (blog / educational posts). Same block model as cms_pages plus
-- article fields (excerpt, cover, category, tags). Public list at /atik and
-- detail at /atik/<slug>. Admins manage; public reads published only.

create table if not exists public.cms_articles (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  status          text not null default 'draft' check (status in ('draft','published')),
  excerpt         text,
  cover_image     text,
  category        text,
  tags            text[] not null default '{}',
  blocks          jsonb not null default '[]'::jsonb,
  seo_title       text,
  seo_description text,
  author_id       uuid references auth.users(id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists cms_articles_pub_idx
  on public.cms_articles (status, published_at desc);

alter table public.cms_articles enable row level security;

drop policy if exists cms_articles_admin_all on public.cms_articles;
create policy cms_articles_admin_all on public.cms_articles
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists cms_articles_public_read on public.cms_articles;
create policy cms_articles_public_read on public.cms_articles
  for select to anon, authenticated
  using (status = 'published');

grant select on public.cms_articles to anon;
