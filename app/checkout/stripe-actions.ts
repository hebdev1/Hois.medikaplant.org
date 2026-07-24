'use server';

// Starting a payment. These actions only ever CREATE a Stripe Checkout
// Session and hand back its URL — they never grant access. Access is granted
// by the webhook (app/api/webhooks/stripe/route.ts), because the member can
// close the browser before returning from Stripe.
//
// The amount charged is never taken from the client: plans use the stored
// Stripe price ID, courses use courses.price_cents read server-side.

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe } from '@/lib/stripe/server';
import { priceIdFor } from '@/lib/stripe/prices';
import { siteUrl } from '@/lib/site-url';
import { isValidPlan, isValidCycle, type BillingCycle } from './plans';
import type { Plan } from '@/types/database';

export type StripeCheckoutResult = { url?: string; error?: string };

/**
 * The member's Stripe Customer, created once and reused so the Billing Portal
 * shows their whole history. Stored on profiles.stripe_customer_id.
 */
async function getOrCreateCustomer(
  userId: string,
  email: string,
  fullName: string | null
): Promise<string> {
  const sb = createServiceClient();

  const { data } = await sb
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();
  const existing = (data as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;
  if (existing) return existing;

  const customer = await getStripe().customers.create({
    email,
    name: fullName ?? undefined,
    metadata: { user_id: userId },
  });

  // Must persist — otherwise every checkout mints a new Stripe customer and
  // the Billing Portal has no customer to open. Surface a write failure
  // instead of swallowing it: it means the service-role key cannot write.
  const { error: saveError } = await sb
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);
  if (saveError) {
    console.error('[stripe] could not save stripe_customer_id', saveError);
    throw new Error(
      'Pa ka anrejistre kliyan Stripe la. Verifye SUPABASE_SERVICE_ROLE_KEY sou sèvè a.'
    );
  }

  return customer.id;
}

/** Signed-in member + the profile fields Stripe needs. */
async function requireMember() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false as const, error: 'Ou dwe konekte.' };

  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return {
    ok: true as const,
    userId: user.id,
    email: user.email,
    fullName: (data as { full_name: string | null } | null)?.full_name ?? null,
  };
}

/** Subscribe to a plan — recurring, billed by Stripe every period. */
export async function startPlanCheckout(
  planRaw: string,
  cycleRaw: string
): Promise<StripeCheckoutResult> {
  if (!isValidPlan(planRaw)) return { error: 'Plan sa a pa valab.' };
  if (!isValidCycle(cycleRaw)) return { error: 'Peryòd peman an pa valab.' };
  const plan: Plan = planRaw;
  const cycle: BillingCycle = cycleRaw;

  const member = await requireMember();
  if (!member.ok) return { error: member.error };

  try {
    const price = await priceIdFor(plan, cycle);
    const customer = await getOrCreateCustomer(
      member.userId,
      member.email,
      member.fullName
    );

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: member.userId,
      // Mirrored onto the subscription so the webhook can identify the member
      // even on events that don't carry the session.
      subscription_data: {
        metadata: { user_id: member.userId, plan, cycle },
      },
      metadata: { user_id: member.userId, plan, cycle },
      success_url: siteUrl(`/dashboard?welcome=${plan}`),
      cancel_url: siteUrl(`/checkout?plan=${plan}&canceled=1`),
      allow_promotion_codes: true,
    });

    if (!session.url) return { error: 'Stripe pa retounen yon lyen peman.' };
    return { url: session.url };
  } catch (e) {
    console.error('[stripe] plan checkout failed', e);
    return { error: (e as Error).message || 'Peman an pa ka kòmanse.' };
  }
}

/** Buy one course outright — a single payment, no renewal. */
export async function startCourseCheckout(
  courseId: string
): Promise<StripeCheckoutResult> {
  const member = await requireMember();
  if (!member.ok) return { error: member.error };

  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from('courses')
      .select('id, title, slug, price_cents')
      .eq('id', courseId)
      .maybeSingle();
    const course = data as {
      id: string;
      title: string;
      slug: string;
      price_cents: number | null;
    } | null;

    if (!course) return { error: 'Kou sa a pa egziste.' };
    if (!course.price_cents || course.price_cents <= 0) {
      return { error: 'Kou sa a pa gen yon pri pou achte.' };
    }

    const customer = await getOrCreateCustomer(
      member.userId,
      member.email,
      member.fullName
    );

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer,
      // Inline price: course prices are owned by our database, so there is no
      // Stripe product to keep in sync.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: course.price_cents,
            product_data: { name: course.title },
          },
        },
      ],
      client_reference_id: member.userId,
      metadata: { user_id: member.userId, course_id: course.id },
      payment_intent_data: {
        metadata: { user_id: member.userId, course_id: course.id },
      },
      success_url: siteUrl(`/dashboard/klas/${course.slug}?achte=1`),
      cancel_url: siteUrl(`/checkout/klas/${course.slug}?canceled=1`),
    });

    if (!session.url) return { error: 'Stripe pa retounen yon lyen peman.' };
    return { url: session.url };
  } catch (e) {
    console.error('[stripe] course checkout failed', e);
    return { error: (e as Error).message || 'Peman an pa ka kòmanse.' };
  }
}

/** Stripe Billing Portal — member manages card, cancels, downloads invoices. */
export async function createPortalSession(): Promise<StripeCheckoutResult> {
  const member = await requireMember();
  if (!member.ok) return { error: member.error };

  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', member.userId)
      .maybeSingle();
    const customerId = (data as { stripe_customer_id: string | null } | null)
      ?.stripe_customer_id;

    if (!customerId) {
      return { error: 'Ou poko gen okenn peman ak Stripe.' };
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: siteUrl('/dashboard/settings'),
    });
    return { url: portal.url };
  } catch (e) {
    console.error('[stripe] portal failed', e);
    return { error: (e as Error).message || 'Pa ka louvri jesyon abònman an.' };
  }
}
