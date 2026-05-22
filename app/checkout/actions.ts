'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site-url';
import { PLANS, isValidPlan } from './plans';

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
  // ── 1. Plan ────────────────────────────────────────────────────────────
  const planRaw = formData.get('plan')?.toString() ?? '';
  if (!isValidPlan(planRaw)) {
    return { error: 'Plan ki chwazi a pa valid.' };
  }
  const plan = PLANS[planRaw];

  // ── 2. Card details (mock validation) ──────────────────────────────────
  const cardholderName =
    formData.get('cardholder_name')?.toString().trim() ?? '';
  const cardNumber =
    formData.get('card_number')?.toString().replace(/\s+/g, '') ?? '';
  const expiry = formData.get('expiry')?.toString().trim() ?? '';
  const cvc = formData.get('cvc')?.toString().trim() ?? '';

  if (!cardholderName || cardholderName.length < 2) {
    return { error: 'Tanpri antre non sou kat la.' };
  }
  if (!/^\d{13,19}$/.test(cardNumber)) {
    return { error: 'Nimewo kat la pa valid.' };
  }
  if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(expiry)) {
    return { error: 'Dat ekspirasyon an pa valid (MM/YY).' };
  }
  if (!/^\d{3,4}$/.test(cvc)) {
    return { error: 'Kòd CVC la pa valid.' };
  }

  // ── 3. Auth — login OR signup OR already signed-in ────────────────────
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
      // Haiti-only gate
      const country = formData.get('country')?.toString().trim().toUpperCase();
      if (country !== 'HT') {
        return {
          error:
            'Plan sa yo disponib sèlman pou manm ki Ayiti. Chwazi Ayiti pou kontinye.',
        };
      }
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
            country: 'HT',
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

      // Persist country on profile so future server checks have it
      await supabase
        .from('profiles')
        .update({ country: 'HT' })
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

  // ── 4. Process checkout via edge function ─────────────────────────────
  const paymentReference = `mock_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  const { data: invokeData, error: invokeError } =
    await supabase.functions.invoke('checkout', {
      body: { plan: plan.key, payment_reference: paymentReference },
    });

  if (invokeError) {
    return {
      error: `Pèman pa pase: ${invokeError.message ?? 'Erè inkoni.'}`,
    };
  }
  const result = invokeData as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    return { error: result?.error ?? 'Pèman pa pase.' };
  }

  revalidatePath('/dashboard');
  return { redirectTo: `/dashboard?welcome=${plan.key}` };
}
