-- 128_cms_block_templates.sql
-- Reusable block templates: a named, saved set of blocks an admin can insert
-- into any Page or Article. Admin-only (not public-readable — they are an
-- editing convenience, never rendered directly to visitors).

create table if not exists public.cms_block_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  blocks     jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cms_block_templates enable row level security;

drop policy if exists cms_block_templates_admin_all on public.cms_block_templates;
create policy cms_block_templates_admin_all on public.cms_block_templates
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
