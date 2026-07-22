# Stripe payments — design

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan

## Goal

Take real money. Members subscribe to a plan with a card and their access is
activated automatically; courses can be bought outright. Card data never
touches our servers.

## Current state

Nothing is charged today. The checkout is a mock:

- `app/checkout/actions.ts` mints `payment_reference = mock_<ts>_<rand>` and
  calls the `checkout` edge function, which re-derives the price via
  `get_plan_price()` and writes a `subscriptions` row. No payment occurs.
- `app/checkout/checkout-form.tsx` renders **real card fields**
  (`card_number`, `cardholder_name`) that post to the server action, with a
  "Mod demo" note. A real card number typed there transits our server — a PCI
  exposure this project removes.
- The `stripe-webhook` edge function is a stub returning `410 Gone`
  ("no Stripe yet").
- No `stripe` npm package, no `STRIPE_*` env vars, no Stripe columns.
- A Supabase Stripe **wrapper** (read-only foreign table `public.checkout`)
  is connected; its public grants were revoked in migration 089. It is a
  reporting convenience only and plays no part in this design.

## Decisions (agreed)

| Question | Decision |
|---|---|
| Billing model for plans | **Auto-renewing Stripe Subscriptions** |
| Courses | **One-time payments**, in scope for this phase |
| Manual / offline path | **None** — Stripe only |
| Payment UI | **Stripe Checkout** (hosted page) |
| Currency | **USD** |

Consequence accepted by the founder: members without an internationally
usable card cannot subscribe. Admins retain the existing `/admin/subscriptions`
tools to adjust a subscription for an exceptional case; that is an operational
escape hatch, not a payment flow.

## Approach

**Stripe Checkout (hosted)** over Elements or Payment Links. The member is
redirected to Stripe, pays, and returns. Card data never reaches us, so the
PCI exposure disappears; Stripe handles 3-D Secure/SCA, wallets, retries and
localized card errors. Least code for the largest correctness win. Elements
(on-site fields) remains a later option if the redirect hurts conversion.

## Architecture

### 1. Stripe catalog
Three products (Bazilik / Sitwonèl / Melis), each with two **recurring**
prices (monthly, yearly). Their IDs go in the existing
`subscription_plans.stripe_price_id_monthly` / `_yearly` columns — no schema
change needed, only data. Courses use **inline `price_data`** at session
creation (name = course title, `unit_amount` = `courses.price_cents`), so
course prices stay owned by our DB and need no Stripe product upkeep.

### 2. Starting a payment
A server action (plans) / route (courses), authenticated:

1. Resolve or create the Stripe **Customer**: if `profiles.stripe_customer_id`
   is null, create one with the member's email and `metadata.user_id`, then
   store it.
2. Create a **Checkout Session**:
   - plans → `mode: 'subscription'`, `line_items: [{ price: <plan price id>, quantity: 1 }]`
   - courses → `mode: 'payment'`, `line_items: [{ price_data: … }]`
   - `customer`, `client_reference_id = user.id`, and `metadata`
     (`user_id`, plus `plan`+`cycle` or `course_id`)
   - `success_url` → plans: `/dashboard?welcome=<plan>`; courses:
     `/dashboard/klas/<slug>?achte=1`.
     `cancel_url` → back to the originating checkout page with `?canceled=1`
3. Redirect to `session.url`.

The price is never taken from the client — it comes from the stored Stripe
price ID or from `courses.price_cents`.

### 3. Webhook — the only thing that grants access
`app/api/webhooks/stripe/route.ts` (Node runtime, `force-dynamic`). Access is
granted **here, not on the success page**, because the member may close the
browser before returning.

- Read the **raw** body and verify the signature with
  `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`. Reject
  unverified requests with 400.
- **Idempotency:** insert `event.id` into a new `stripe_events` table; on
  conflict, return 200 immediately. Stripe retries, and every handler must be
  safe to run twice.
- Use the **service-role** client (the request is unauthenticated but
  signature-verified); it bypasses RLS deliberately.

Events handled:

| Event | Action |
|---|---|
| `checkout.session.completed` (mode `payment`) | insert `course_purchases` (`payment_reference` = payment-intent id, `status = 'paid'`, `amount_cents`, `currency = 'usd'`) + a `course_enrollments` row with `source = 'purchase'` |
| `customer.subscription.created` / `.updated` | upsert the member's `subscriptions` row |
| `customer.subscription.deleted` | mark the row `cancelled` |
| `invoice.payment_failed` | log; keep access (see status mapping) |

`checkout.session.completed` in `subscription` mode needs no work — the
subscription events carry the authoritative state.

### 4. Subscription row mapping
`subscription_status` has exactly three values: `active`, `cancelled`,
`expired`. Map Stripe onto them so a failed payment does not instantly cut
access while Stripe is still retrying:

- Stripe `active`, `trialing`, `past_due` → **`active`**
- Stripe `canceled`, `unpaid`, `incomplete_expired` → **`cancelled`**
- `incomplete` → no row change (payment never completed)

Also written: `plan` (from the price ID → plan lookup), `billing_cycle` (from
the price's interval), `end_date` = `current_period_end`, `amount`,
`stripe_subscription_id`, `stripe_price_id`. Natural expiry still works
through `end_date`.

### 5. Access activation — unchanged machinery
Writing the `subscriptions` row is enough. The existing
`trg_sync_profile_plan` trigger updates `profiles.plan`, and the middleware's
active-subscription check grants the dashboard. **No change to gating.**

### 6. Self-service billing
A "Jere abònman" button in `/dashboard/settings` opens a **Stripe Billing
Portal** session: the member updates their card, cancels, or downloads
invoices without involving the founder.

### 7. Remove the mock
Delete the card fields from `checkout-form.tsx` (replaced by a "Peye ak kat"
button) and drop the `mock_` reference path from `app/checkout/actions.ts`.
The `checkout` edge function is no longer used for payment; leave it deployed
but unreferenced, or retire it in a follow-up.

## Schema changes (migration)

```sql
alter table public.profiles      add column stripe_customer_id text unique;
alter table public.subscriptions add column stripe_subscription_id text unique,
                                 add column stripe_price_id text;

create table public.stripe_events (
  id          text primary key,          -- Stripe event id
  type        text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;  -- no policies: service-role only
```

`subscription_plans.stripe_price_id_*` already exist and only need populating.

## Security

- Card data never reaches our servers (hosted Checkout); the demo card inputs
  are deleted.
- Webhook verifies the Stripe signature before parsing; no unsigned request
  mutates anything.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only, stored in
  the Hostinger environment, never in git. Only the publishable key may ever
  reach the client (not required for the redirect flow).
- `stripe_events` and all webhook writes go through the service-role client
  and are unreachable from the browser (`anon` gets no grants).

## Testing

1. Build against Stripe **test** keys throughout.
2. Test cards: success `4242 4242 4242 4242`; SCA `4000 0025 0000 3155`;
   decline `4000 0000 0000 0002`.
3. Verify the webhook by replaying events, and confirm: subscription row
   created with the right plan/cycle/end date, `profiles.plan` synced,
   dashboard unlocked, course purchase + enrollment inserted.
4. Re-send the same event and confirm nothing duplicates.
5. Cancel from the Billing Portal and confirm the row flips to `cancelled`.
6. Switch to live keys only after all of the above pass.

## Deployment prerequisite

Stripe must reach the webhook over the public internet, so **the site must be
deployed to `hoismedikaplant.com`** before the integration can be completed or
tested end to end. Deployment is now a prerequisite, not a follow-up.

## Non-goals

- No Elements/on-site card fields in this phase.
- No manual/offline (MonCash, cash) payment path.
- No proration/upgrade-downgrade flows beyond what the Billing Portal offers.
- No migration of existing mock subscriptions — they expire naturally via
  `end_date`; new purchases go through Stripe.
- The Stripe wrapper foreign table stays read-only and unused by the app.

## Open item for the founder

Stripe does not support businesses based in Haiti. The connected API key
works for reads, but payouts require the Stripe account to be registered in a
supported country. Confirm in Stripe Dashboard → Settings → Business before
switching to live keys.

## Acceptance

- A member can subscribe with a test card and lands on the dashboard with the
  correct plan unlocked, driven by the webhook alone.
- A member can buy a course and is enrolled automatically.
- Replayed webhook events change nothing the second time.
- Cancelling in the Billing Portal revokes access at period end.
- No card input field exists anywhere in our own markup.
- `tsc --noEmit` and `next build` pass.
