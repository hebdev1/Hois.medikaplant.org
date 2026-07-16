-- Migration 085: VIP page membership. Sitwonèl (premium) members — and the
-- higher Melis (vip) tier — can opt into the VIP space; everyone else sees a
-- locked/upsell state. Membership is a simple per-user opt-in row; the
-- plan-tier gate is enforced server-side in the joinVip action, RLS just
-- keeps each user to their own row.

create table if not exists public.vip_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table public.vip_members enable row level security;

drop policy if exists vip_members_own on public.vip_members;
create policy vip_members_own on public.vip_members
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
