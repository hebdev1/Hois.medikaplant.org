import Stripe from 'stripe';

/**
 * Server-only Stripe client.
 *
 * The secret key must never reach the browser — only import this from server
 * actions, route handlers, or server components.
 *
 * Test vs live is decided purely by which key is in the environment; the code
 * is identical in both modes. Note that price IDs created in test mode do NOT
 * exist in live mode, so `subscription_plans.stripe_price_id_*` must hold the
 * IDs for whichever mode the deployed key belongs to.
 *
 * apiVersion is intentionally left to the SDK default so it always matches the
 * bundled type definitions; upgrading the package upgrades both together.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Fail loudly: a silently missing key would turn every checkout into a
    // confusing runtime error much further downstream.
    throw new Error('STRIPE_SECRET_KEY manke nan anviwònman an.');
  }

  cached = new Stripe(key, { typescript: true });
  return cached;
}

/** True when the configured key is a live key — used to guard test-only UI. */
export function isLiveMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_');
}
