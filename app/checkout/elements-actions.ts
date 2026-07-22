'use server';

// On-page card payments (Stripe Elements).
//
// Unlike hosted Checkout, the card fields live on our own page — but they are
// rendered by Stripe inside its own iframe, so the card number still travels
// straight from the browser to Stripe and never reaches this server.
//
// These actions only PREPARE a payment and hand back a client secret. The
// card is confirmed in the browser, and access is still granted solely by the
// webhook, which is the only source Stripe actually confirms payment to.

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe } from '@/lib/stripe/server';
import { priceIdFor } from '@/lib/stripe/prices';
import { isValidPlan, isValidCycle, type BillingCycle } from './plans';
import type { Plan } from '@/types/database';

export type IntentResult = {
  clientSecret?: string;
  /** Where to send the member once the card is confirmed. */
  returnPath?: string;
  error?: string;
};

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
  await sb
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);
  return customer.id;
}

/**
 * Prepare a plan subscription for on-page payment.
 *
 * `default_incomplete` makes Stripe create the subscription but wait for the
 * card: it hands back the first invoice's PaymentIntent, which the browser
 * confirms. If the card is declined the subscription simply never activates,
 * so nothing is granted — exactly the behaviour asked for.
 */
export async function createPlanIntent(
  planRaw: string,
  cycleRaw: string
): Promise<IntentResult> {
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

    const subscription = await getStripe().subscriptions.create({
      customer,
      items: [{ price }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.confirmation_secret'],
      metadata: { user_id: member.userId, plan, cycle },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = (subscription as any).latest_invoice;
    const clientSecret =
      invoice?.confirmation_secret?.client_secret ??
      invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      return { error: 'Stripe pa bay yon sekrè pou konfime peman an.' };
    }

    return { clientSecret, returnPath: `/dashboard?welcome=${plan}` };
  } catch (e) {
    console.error('[stripe] plan intent failed', e);
    return { error: (e as Error).message || 'Peman an pa ka kòmanse.' };
  }
}

/** Prepare a one-off course purchase for on-page payment. */
export async function createCourseIntent(
  courseId: string
): Promise<IntentResult> {
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

    const intent = await getStripe().paymentIntents.create({
      customer,
      amount: course.price_cents,
      currency: 'usd',
      description: course.title,
      automatic_payment_methods: { enabled: true },
      metadata: { user_id: member.userId, course_id: course.id },
    });

    if (!intent.client_secret) {
      return { error: 'Stripe pa bay yon sekrè pou konfime peman an.' };
    }

    return {
      clientSecret: intent.client_secret,
      returnPath: `/dashboard/klas/${course.slug}?achte=1`,
    };
  } catch (e) {
    console.error('[stripe] course intent failed', e);
    return { error: (e as Error).message || 'Peman an pa ka kòmanse.' };
  }
}
