-- 127_cms_videos.sql
-- CMS Videos: a light content type — a video embed (YouTube/Vimeo/file URL)
-- plus title/description/thumbnail/category. Public list at /videyo, detail at
-- /videyo/<slug>. Admins manage; public reads published only.

create table if not exists public.cms_videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  status       text not null default 'draft' check (status in ('draft','published')),
  description  text,
  video_url    text,
  thumbnail    text,
  category     text,
  published_at timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists cms_videos_pub_idx
  on public.cms_videos (status, published_at desc);

alter table public.cms_videos enable row level security;

drop policy if exists cms_videos_admin_all on public.cms_videos;
create policy cms_videos_admin_all on public.cms_videos
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists cms_videos_public_read on public.cms_videos;
create policy cms_videos_public_read on public.cms_videos
  for select to anon, authenticated
  using (status = 'published');

grant select on public.cms_videos to anon;
