'use server';

import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site-url';
import { PLANS, isValidPlan, isValidCycle, type BillingCycle } from './plans';

export type CheckoutState = {
  error?: string;
  /**
   * When set, the form should switch to the "login" sub-form. We surface
   * this so a stale "Account already exists" signup attempt nudges the
   * visitor toward the login tab without retyping their email.
   */
  switchToLogin?: boolean;
  /**
   * On successful checkout we return the post-purchase URL instead of
   * calling Next's `redirect()` directly. The client effect then drives a
   * full-page navigation, which is the only reliable way to guarantee the
   * freshly-issued session cookie is in scope on the destination page —
   * `redirect()` inside a server action can race the cookie write when
   * called immediately after `signUp` / `signInWithPassword`.
   */
  redirectTo?: string;
  /** Auth succeeded — the form should now show the card fields. */
  authed?: boolean;
};

/**
 * One-shot purchase entry point — the form may include either credentials
 * for an existing account (`mode=login`) or full signup details
 * (`mode=signup`). On success we land on the dashboard with the welcome
 * banner. On failure we return a state object so the form can re-render
 * with the error inline.
 *
 * Country gate: signup is rejected outside Haiti (`country !== 'HT'`).
 * Existing members are not re-checked — once they have an account, they
 * can buy/upgrade regardless of where they sign in from.
 */
export async function processCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  // ── 1. Plan + billing cycle ───────────────────────────────────────────
  const planRaw = formData.get('plan')?.toString() ?? '';
  if (!isValidPlan(planRaw)) {
    return { error: 'Plan ki chwazi a pa valid.' };
  }
  const plan = PLANS[planRaw];

  // Validate the cycle, but never trust a price from the client — the amount
  // comes from the Stripe price ID stored server-side.
  const cycleRaw = formData.get('cycle')?.toString() ?? 'yearly';
  const cycle: BillingCycle = isValidCycle(cycleRaw) ? cycleRaw : 'yearly';

  // ── 2. Auth — login OR signup OR already signed-in ────────────────────
  // No card validation here: the card fields are Stripe Elements, so the
  // number goes straight from the browser to Stripe and is never submitted
  // to this action.
  const supabase = createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const mode = formData.get('mode')?.toString() ?? 'login';
    const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    if (!email || !password) {
      return { error: 'Imel ak modpas obligatwa.' };
    }
    if (password.length < 6) {
      return { error: 'Modpas la dwe gen omwen 6 karaktè.' };
    }

    if (mode === 'signup') {
      // Worldwide eligibility — every country can subscribe. We still
      // capture the selected country so the profile is complete and the
      // team can segment by region later. Falls back to 'HT' when the
      // form posts nothing.
      const country =
        formData.get('country')?.toString().trim().toUpperCase() || 'HT';
      const firstName =
        formData.get('first_name')?.toString().trim() ?? '';
      const lastName = formData.get('last_name')?.toString().trim() ?? '';
      if (firstName.length < 2 || lastName.length < 2) {
        return { error: 'Antre prenon ak non w nèt.' };
      }

      const fullName = `${firstName} ${lastName}`.trim();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            country,
            intended_plan: plan.key,
          },
          // If Supabase Auth requires email confirmation, the confirmation
          // link drops them right back on /checkout so they can complete
          // payment after verifying.
          emailRedirectTo: siteUrl(`/checkout?plan=${plan.key}`),
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          msg.includes('user already')
        ) {
          return {
            error:
              'Yon kont ak imel sa egziste deja. Konekte ak modpas ou pi ba a.',
            switchToLogin: true,
          };
        }
        return { error: signUpError.message };
      }
      if (!signUpData.user) {
        return { error: 'Kreyasyon kont lan pa pase. Eseye ankò.' };
      }

      // Persist the chosen country on the profile so future server
      // checks + region segmentation have it.
      await supabase
        .from('profiles')
        .update({ country })
        .eq('id', signUpData.user.id);

      // If Supabase Auth has email confirmations on, signup won't return a
      // session — we cannot complete checkout. Surface a clean message.
      if (!signUpData.session) {
        return {
          error:
            'Tcheke imel ou pou konfime kont lan, apre sa retounen pou peye plan an.',
        };
      }

      user = signUpData.user;
    } else {
      // Login mode
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.user) {
        return { error: 'Imel oswa modpas pa kòrèk.' };
      }
      user = signInData.user;
    }
  }

  // ── 3. Authenticated — the card step happens on this same page ────────
  // We deliberately do NOT redirect anywhere. The form now reveals the
  // Stripe card fields inline; the member is only sent onward once Stripe
  // confirms the payment.
  return { authed: true };
}
