-- 125_redirects.sql
-- CMS redirects: admin-managed URL redirects (e.g. an old slug -> a new one).
-- The middleware reads ACTIVE rows (cached ~60s) and issues the redirect before
-- rendering. Admins manage; anon may read active rows (needed by middleware).

create table if not exists public.redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null unique,           -- e.g. /ansyen-paj  (leading slash, no query)
  to_path     text not null,                  -- e.g. /nouvo-paj  or  https://...
  status_code int  not null default 301 check (status_code in (301, 302, 307, 308)),
  active      boolean not null default true,
  hits        int not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.redirects enable row level security;

drop policy if exists redirects_admin_all on public.redirects;
create policy redirects_admin_all on public.redirects
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Middleware reads active redirects with the anon key.
drop policy if exists redirects_public_read on public.redirects;
create policy redirects_public_read on public.redirects
  for select to anon, authenticated
  using (active = true);

grant select on public.redirects to anon;
