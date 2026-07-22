# Implementation plan — Stripe payments

Spec: `docs/superpowers/specs/2026-07-22-stripe-payments-design.md`

Ordered; each step ends compiling. Everything is built against Stripe **test**
keys. Live keys are the last action, and only after the founder confirms the
merchant country.

## Step 1 — dependency + server client
- `npm i stripe`.
- `lib/stripe/server.ts`: a single server-only Stripe client from
  `STRIPE_SECRET_KEY`, pinned `apiVersion`. Throws a clear error when the key
  is missing so misconfiguration fails loudly rather than silently.
- Document `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in
  `.env.example` / the deploy README. Never committed.

## Step 2 — schema migration (090)
- `profiles.stripe_customer_id text unique`
- `subscriptions.stripe_subscription_id text unique`, `subscriptions.stripe_price_id text`
- `stripe_events (id text pk, type text not null, received_at timestamptz default now())`,
  RLS enabled with **no policies** (service-role only).
- Regenerate `types/database.ts` entries for the new columns/table.

## Step 3 — Stripe catalog + price↔plan mapping
- Create 3 products × 2 recurring prices in Stripe (test mode), USD.
- Store the IDs in the existing `subscription_plans.stripe_price_id_monthly` /
  `_yearly` (data only — columns already exist).
- `lib/stripe/plans.ts`: resolve plan+cycle → price ID, and the reverse
  (price ID → plan, cycle) for the webhook. Reverse lookup reads
  `subscription_plans` so changing a price in Stripe needs no redeploy.

## Step 4 — start a payment
- `app/checkout/stripe-actions.ts`:
  - `getOrCreateCustomer(userId)` → reuses `profiles.stripe_customer_id`,
    else creates a Stripe Customer (email + `metadata.user_id`) and stores it.
  - `startPlanCheckout(plan, cycle)` → `mode:'subscription'`, price from
    step 3, `client_reference_id = user.id`, metadata `{user_id, plan, cycle}`,
    `success_url=/dashboard?welcome=<plan>`, `cancel_url=/checkout?canceled=1`.
  - `startCourseCheckout(courseId)` → `mode:'payment'`, inline `price_data`
    from `courses.price_cents` + title, metadata `{user_id, course_id}`,
    `success_url=/dashboard/klas/<slug>?achte=1`.
  - Both return the session URL; the caller redirects. Price never comes from
    the client.

## Step 5 — webhook
`app/api/webhooks/stripe/route.ts` (`runtime='nodejs'`, `force-dynamic`):
- Raw body + `stripe.webhooks.constructEvent(...)`; 400 on bad signature.
- Idempotency: insert `event.id` into `stripe_events`; on unique-violation
  return 200 without re-processing.
- Service-role client for all writes.
- Handlers:
  - `checkout.session.completed` & `mode==='payment'` → insert
    `course_purchases` (`status='paid'`, `amount_cents`, `currency='usd'`,
    `payment_reference` = payment-intent id) + `course_enrollments`
    (`source='purchase'`), both idempotent on (user, course).
  - `customer.subscription.created|updated` → upsert `subscriptions` keyed on
    `stripe_subscription_id`: plan+cycle from the price lookup, `end_date` =
    `current_period_end`, `amount`, status per the mapping below.
  - `customer.subscription.deleted` → `cancelled`.
  - `invoice.payment_failed` → `cancelled` (immediate cutoff).
- Status mapping: `active|trialing` → `active`;
  `past_due|canceled|unpaid|incomplete_expired` → `cancelled`;
  `incomplete` → no change.

## Step 6 — Billing Portal
- `createPortalSession()` action → Stripe Billing Portal for the member's
  customer, `return_url=/dashboard/settings`.
- "Jere abònman" button in `/dashboard/settings`, shown only when the member
  has a `stripe_customer_id`.

## Step 7 — remove the mock
- Delete the card fields (`card_number`, `cardholder_name`, `formatCardNumber`,
  the "Mod demo" note) from `app/checkout/checkout-form.tsx`; replace the
  submit with a "Peye ak kat" button that calls `startPlanCheckout`.
- Drop the `mock_` reference path and the `checkout` edge-function invoke from
  `app/checkout/actions.ts`, keeping the signup/auth steps that precede payment.
- Same for the course checkout page.
- Grep the repo afterwards to prove no card input remains in our markup.

## Step 8 — verify
- `npx tsc --noEmit`; `npm run build`.
- Local webhook via `stripe listen --forward-to localhost:3001/api/webhooks/stripe`.
- Test cards: `4242…4242` success, `4000 0025 0000 3155` SCA,
  `4000 0000 0000 0002` decline.
- Confirm: subscription row correct (plan, cycle, end_date), `profiles.plan`
  synced by the existing trigger, dashboard unlocked; course purchase +
  enrollment created; replaying an event changes nothing; portal cancel flips
  the row.

## Step 9 — ship
- Commit + push.
- Deploy (**required** — Stripe must reach the webhook publicly).
- Register the live webhook endpoint in Stripe, set the env vars on Hostinger.
- Switch to live keys only after the founder confirms the merchant country.

## Acceptance
Per the spec: webhook-driven activation, idempotent replays, immediate cutoff
on failed payment, no card field in our own markup, tsc + build clean.
