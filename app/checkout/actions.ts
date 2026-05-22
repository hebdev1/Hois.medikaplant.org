'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PLANS, isValidPlan } from './plans';

export type CheckoutState = {
  error?: string;
};

export async function processCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const planRaw = formData.get('plan')?.toString() ?? '';
  if (!isValidPlan(planRaw)) {
    return { error: 'Plan ki chwazi a pa valid.' };
  }
  const plan = PLANS[planRaw];

  const cardholderName = formData.get('cardholder_name')?.toString().trim() ?? '';
  const cardNumber = formData.get('card_number')?.toString().replace(/\s+/g, '') ?? '';
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

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Ou dwe konekte pou w peye.' };
  }

  // ── Defer the actual subscription mutation to the `checkout` edge function.
  // Running the insert + cancel-prior-active behind the service role inside
  // the edge keeps the contract atomic and prevents clients from rolling
  // their own plan upgrades via direct table writes.
  const paymentReference = `mock_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  const { data, error: invokeError } = await supabase.functions.invoke(
    'checkout',
    {
      body: {
        plan: plan.key,
        payment_reference: paymentReference,
      },
    }
  );

  if (invokeError) {
    return {
      error: `Pèman pa pase: ${invokeError.message ?? 'Erè inkoni.'}`,
    };
  }
  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    return { error: result?.error ?? 'Pèman pa pase.' };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard?welcome=${plan.key}`);
}
