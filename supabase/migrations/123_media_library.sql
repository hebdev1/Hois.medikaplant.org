-- 123_media_library.sql
-- CMS Media Library: folders + assets. The binary files live in the existing
-- `public-assets` storage bucket under a `media/` prefix; these tables hold the
-- metadata + public URL and power the /admin/media browser. Admin-only via
-- public.is_admin(); no anon access.

create table if not exists public.media_folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,          -- path inside the public-assets bucket
  url          text not null,                 -- public URL
  filename     text not null,                 -- original upload name
  title        text,
  alt_text     text,
  caption      text,
  description  text,
  credit       text,
  folder_id    uuid references public.media_folders(id) on delete set null,
  mime_type    text not null,
  width        int,
  height       int,
  bytes        bigint not null default 0,
  uploaded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists media_assets_folder_idx  on public.media_assets (folder_id);
create index if not exists media_assets_created_idx on public.media_assets (created_at desc);

alter table public.media_folders enable row level security;
alter table public.media_assets  enable row level security;

-- Admin-only management (mirrors the rest of the CMS tables). No anon grant.
drop policy if exists media_folders_admin_all on public.media_folders;
create policy media_folders_admin_all on public.media_folders
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists media_assets_admin_all on public.media_assets;
create policy media_assets_admin_all on public.media_assets
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Default folders from the CMS spec (section 8).
insert into public.media_folders (name, slug, sort_order) values
  ('Logo',        'logos',        1),
  ('Plant',       'plants',       2),
  ('Resèt',       'recipes',      3),
  ('Pwodwi',      'products',     4),
  ('Kou',         'courses',      5),
  ('Laboratwa',   'laboratory',   6),
  ('Ekip',        'team',         7),
  ('Banyè',       'banners',      8),
  ('Temwayaj',    'testimonials', 9),
  ('Rezo sosyal', 'social',      10)
on conflict (slug) do nothing;
