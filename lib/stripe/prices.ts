// Server-only: pulls the service-role client, so never import from a client
// component.
import { createServiceClient } from '@/lib/supabase/service';
import type { Plan } from '@/types/database';
import type { BillingCycle } from '@/app/checkout/plans';

/**
 * Plan ↔ Stripe price mapping.
 *
 * The IDs live in `subscription_plans.stripe_price_id_monthly/_yearly` rather
 * than in code, for two reasons: a price created in Stripe TEST mode does not
 * exist in LIVE mode, and the founder may re-price in Stripe. Reading them
 * from the database means switching modes or changing a price needs no
 * redeploy — just new rows.
 */

type PlanPriceRow = {
  id: Plan;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
};

async function loadPlanPrices(): Promise<PlanPriceRow[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('subscription_plans')
    .select('id, stripe_price_id_monthly, stripe_price_id_yearly');
  if (error) throw new Error(`Pa ka li pri plan yo: ${error.message}`);
  return (data ?? []) as PlanPriceRow[];
}

/** The Stripe price ID to charge for a (plan, cycle). */
export async function priceIdFor(
  plan: Plan,
  cycle: BillingCycle
): Promise<string> {
  const rows = await loadPlanPrices();
  const row = rows.find((r) => r.id === plan);
  const priceId =
    cycle === 'yearly' ? row?.stripe_price_id_yearly : row?.stripe_price_id_monthly;

  if (!priceId) {
    // Actionable on purpose: this is the one piece of setup that must be done
    // by hand in the Stripe dashboard before checkout can work at all.
    throw new Error(
      `Pri Stripe pou plan "${plan}" (${cycle}) pa konfigire. ` +
        `Mete ID a nan subscription_plans.stripe_price_id_${cycle === 'yearly' ? 'yearly' : 'monthly'}.`
    );
  }
  return priceId;
}

/**
 * Reverse lookup used by the webhook: which plan and cycle does this Stripe
 * price represent? Returns null when the price is unknown to us (for example
 * a course's inline price), so callers can ignore it rather than guess.
 */
export async function planForPriceId(
  priceId: string
): Promise<{ plan: Plan; cycle: BillingCycle } | null> {
  const rows = await loadPlanPrices();
  for (const row of rows) {
    if (row.stripe_price_id_monthly === priceId) {
      return { plan: row.id, cycle: 'monthly' };
    }
    if (row.stripe_price_id_yearly === priceId) {
      return { plan: row.id, cycle: 'yearly' };
    }
  }
  return null;
}
