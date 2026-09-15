-- 130_coupons.sql
-- CMS-managed coupon records (code + discount). Redemption at checkout is the
-- shop's concern; this is the admin-managed catalog of coupons. Admin-only.

create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  description   text,
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed')),
  amount        numeric not null default 0,
  active        boolean not null default true,
  expires_at    timestamptz,
  max_uses      int,
  used_count    int not null default 0,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.coupons enable row level security;

drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
