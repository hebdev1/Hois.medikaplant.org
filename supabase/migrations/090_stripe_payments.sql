-- Stripe payments: link our records to Stripe objects, and make webhook
-- processing idempotent.
--
-- Access is granted by the webhook, never by the browser returning from
-- Stripe, so these columns are the join between a Stripe event and the member
-- whose plan it unlocks.

-- The member's Stripe Customer. One per profile, reused across purchases so
-- the Billing Portal shows their whole history.
alter table public.profiles
  add column if not exists stripe_customer_id text;

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- The Stripe Subscription behind a subscriptions row. Unique so replayed
-- webhook events upsert instead of duplicating.
alter table public.subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text;

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Every Stripe event id we have already handled. Stripe retries deliveries,
-- so each handler must be safe to run twice; inserting here first turns that
-- into a cheap primary-key check.
create table if not exists public.stripe_events (
  id          text primary key,
  type        text        not null,
  received_at timestamptz not null default now()
);

-- Service-role only: RLS on with no policies means anon/authenticated can
-- read or write nothing, while the webhook's service client bypasses RLS.
alter table public.stripe_events enable row level security;

revoke all on table public.stripe_events from anon, authenticated;
