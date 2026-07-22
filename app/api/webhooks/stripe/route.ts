import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/service';
import { planForPriceId } from '@/lib/stripe/prices';
import type { Plan } from '@/types/database';

// ───────────────────────────────────────────────────────────────────────────
// Stripe webhook — the ONLY place that grants paid access.
//
// The success page is never trusted: a member can close the browser before
// returning from Stripe, and anyone can visit a success URL. Stripe tells us
// what was actually paid, and we act on that alone.
//
// Every request is signature-verified, and every event is recorded in
// stripe_events before processing so Stripe's retries cannot double-apply.
// All writes use the service-role client: the request is unauthenticated by
// nature, so RLS is bypassed deliberately after the signature proves origin.
// ───────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Stripe status → our 3-value subscription_status enum.
 *
 * The founder chose to cut access the moment a payment fails rather than
 * carry members through Stripe's retry window, so `past_due` is NOT active.
 * If the member fixes their card, Stripe sends `customer.subscription.updated`
 * with `active` and access is restored automatically. */
function mapStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'cancelled' | null {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'cancelled';
    default:
      // `incomplete`, `paused` — payment never completed; leave the row alone.
      return null;
  }
}

/** Period end moved from the subscription to its items in recent API versions;
 *  read whichever this account's version provides. */
function periodEndISO(sub: Stripe.Subscription): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySub = sub as any;
  const raw =
    anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end;
  return typeof raw === 'number' ? new Date(raw * 1000).toISOString() : null;
}

/** Resolve the member behind a subscription: metadata first, then the
 *  customer id we stored on their profile. */
async function resolveUserId(
  sb: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription
): Promise<string | null> {
  const fromMeta = sub.metadata?.user_id;
  if (fromMeta) return fromMeta;

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!customerId) return null;

  const { data } = await sb
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

async function applySubscription(
  sb: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription,
  forceCancelled = false
) {
  const status = forceCancelled ? 'cancelled' : mapStatus(sub.status);
  if (!status) return;

  const userId = await resolveUserId(sb, sub);
  if (!userId) {
    console.error('[stripe] no member for subscription', sub.id);
    return;
  }

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const mapped = priceId ? await planForPriceId(priceId) : null;
  if (!mapped) {
    console.error('[stripe] unknown price on subscription', sub.id, priceId);
    return;
  }

  const amount =
    typeof item?.price?.unit_amount === 'number'
      ? item.price.unit_amount / 100
      : null;

  const row = {
    user_id: userId,
    plan: mapped.plan as Plan,
    billing_cycle: mapped.cycle,
    status,
    end_date: periodEndISO(sub),
    amount,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    payment_reference: sub.id,
  };

  // Manual upsert: the unique index on stripe_subscription_id is partial
  // (WHERE NOT NULL), which ON CONFLICT inference cannot target through
  // PostgREST.
  const { data: existing } = await sb
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  if (existing) {
    await sb
      .from('subscriptions')
      .update(row)
      .eq('id', (existing as { id: string }).id);
  } else {
    await sb.from('subscriptions').insert({ ...row, start_date: new Date().toISOString() });
  }

  // A member who now pays through Stripe should not also carry an older
  // active row from the pre-Stripe mock checkout — that would leave two
  // active subscriptions fighting over profiles.plan. Stripe is authoritative.
  if (status === 'active') {
    await sb
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('stripe_subscription_id', null);
  }
}

async function applyCoursePurchase(
  sb: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  const courseId = session.metadata?.course_id;
  if (!userId || !courseId) {
    console.error('[stripe] course session missing metadata', session.id);
    return;
  }

  const paymentRef =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  const { data: already } = await sb
    .from('course_purchases')
    .select('id')
    .eq('payment_reference', paymentRef)
    .maybeSingle();

  if (!already) {
    await sb.from('course_purchases').insert({
      course_id: courseId,
      user_id: userId,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      payment_reference: paymentRef,
      status: 'paid',
    });
  }

  // Enrol them. Separate existence check so a replay cannot duplicate.
  const { data: enrolled } = await sb
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!enrolled) {
    await sb
      .from('course_enrollments')
      .insert({ course_id: courseId, user_id: userId, source: 'purchase' });
  }
}

/** Same as applyCoursePurchase, but for the on-page Elements flow, which
 *  produces a bare PaymentIntent rather than a Checkout Session. */
async function applyCoursePurchaseFromIntent(
  sb: ReturnType<typeof createServiceClient>,
  intent: Stripe.PaymentIntent
) {
  const userId = intent.metadata?.user_id;
  const courseId = intent.metadata?.course_id;
  // Plan payments also produce PaymentIntents; those carry no course_id and
  // are handled by the subscription events instead.
  if (!userId || !courseId) return;

  const { data: already } = await sb
    .from('course_purchases')
    .select('id')
    .eq('payment_reference', intent.id)
    .maybeSingle();

  if (!already) {
    await sb.from('course_purchases').insert({
      course_id: courseId,
      user_id: userId,
      amount_cents: intent.amount_received || intent.amount,
      currency: intent.currency ?? 'usd',
      payment_reference: intent.id,
      status: 'paid',
    });
  }

  const { data: enrolled } = await sb
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!enrolled) {
    await sb
      .from('course_enrollments')
      .insert({ course_id: courseId, user_id: userId, source: 'purchase' });
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET manke');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  // The raw body is required — any parsing would break the signature.
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    console.error('[stripe] signature verification failed', (e as Error).message);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Idempotency gate. Stripe retries until it gets a 2xx, so a handler may be
  // delivered several times; the primary key makes the second one a no-op.
  const { error: seenError } = await sb
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });
  if (seenError) {
    // Unique violation = already processed. Anything else is still safest to
    // acknowledge, or Stripe will hammer the endpoint forever.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Subscriptions need no work here — the subscription.* events carry
        // the authoritative state. Only one-off course payments land here.
        if (session.mode === 'payment') await applyCoursePurchase(sb, session);
        break;
      }

      case 'payment_intent.succeeded':
        await applyCoursePurchaseFromIntent(
          sb,
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await applySubscription(sb, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await applySubscription(
          sb,
          event.data.object as Stripe.Subscription,
          true
        );
        break;

      case 'invoice.payment_failed': {
        // Access is cut immediately. Re-read the subscription so we act on
        // Stripe's current state rather than the invoice snapshot.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subId) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          await applySubscription(sb, sub, true);
        }
        break;
      }

      default:
        // Everything else is recorded and ignored on purpose.
        break;
    }
  } catch (e) {
    console.error('[stripe] handler failed for', event.type, e);
    // Let Stripe retry: remove the idempotency marker so the retry runs.
    await sb.from('stripe_events').delete().eq('id', event.id);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
