-- 129_cms_revisions_audit.sql
-- Content revisions (version history for pages/articles) + a general CMS audit
-- log. Both admin-only; neither is public.

-- ── Revisions ─────────────────────────────────────────────────────────────
create table if not exists public.cms_revisions (
  id           uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('page','article')),
  content_id   uuid not null,
  title        text,
  blocks       jsonb not null default '[]'::jsonb,
  saved_by     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists cms_revisions_content_idx
  on public.cms_revisions (content_type, content_id, created_at desc);

alter table public.cms_revisions enable row level security;
drop policy if exists cms_revisions_admin_all on public.cms_revisions;
create policy cms_revisions_admin_all on public.cms_revisions
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ── Audit log ─────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  action      text not null,          -- create | update | publish | unpublish | delete | restore | upload
  entity      text not null,          -- page | article | video | media | redirect | template
  entity_id   text,
  summary     text,                   -- human label, e.g. the title
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using (public.is_admin(auth.uid()));
-- Writes go through the service/admin server actions (insert allowed to admins).
drop policy if exists audit_logs_admin_insert on public.audit_logs;
create policy audit_logs_admin_insert on public.audit_logs
  for insert to authenticated
  with check (public.is_admin(auth.uid()));
