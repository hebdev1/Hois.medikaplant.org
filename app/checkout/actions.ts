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
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Ou dwe konekte pou w peye.' };
  }

  // Mock payment "success" — generate a fake reference.
  // In production, replace with Stripe / Moncash / payment gateway flow.
  const paymentReference = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  // Cancel any existing active subscriptions before creating the new one
  // (database trigger will reconcile profile.plan to the highest active plan).
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const { error: insertError } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    plan: plan.key,
    status: 'active',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    amount: plan.price,
    payment_reference: paymentReference,
  });

  if (insertError) {
    return { error: `Yon erè rive: ${insertError.message}` };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard?welcome=${plan.key}`);
}
