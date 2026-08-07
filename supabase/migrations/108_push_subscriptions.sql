-- Web Push subscriptions (one row per device/browser a member enabled).
-- The fanout (send) path reads these via the service role; clients only ever
-- touch their own rows.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Clients manage only their own subscriptions; the service role (fanout +
-- dead-endpoint cleanup) bypasses RLS.
drop policy if exists "push_subs_select_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions
  for select using (user_id = auth.uid());
drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
create policy "push_subs_insert_own" on public.push_subscriptions
  for insert with check (user_id = auth.uid());
drop policy if exists "push_subs_update_own" on public.push_subscriptions;
create policy "push_subs_update_own" on public.push_subscriptions
  for update using (user_id = auth.uid());
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;
create policy "push_subs_delete_own" on public.push_subscriptions
  for delete using (user_id = auth.uid());
