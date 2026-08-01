-- Menstruation tracking: one row per period day (with optional flow). Cycle
-- stats (length, prediction) are derived from these rows.
create table if not exists public.period_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  flow smallint check (flow between 1 and 3),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists idx_period_days_user on public.period_days(user_id, day);

alter table public.period_days enable row level security;

drop policy if exists "period_days_select_own" on public.period_days;
create policy "period_days_select_own" on public.period_days
  for select using (user_id = auth.uid());
drop policy if exists "period_days_insert_own" on public.period_days;
create policy "period_days_insert_own" on public.period_days
  for insert with check (user_id = auth.uid());
drop policy if exists "period_days_update_own" on public.period_days;
create policy "period_days_update_own" on public.period_days
  for update using (user_id = auth.uid());
drop policy if exists "period_days_delete_own" on public.period_days;
create policy "period_days_delete_own" on public.period_days
  for delete using (user_id = auth.uid());
