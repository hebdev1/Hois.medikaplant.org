'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type SubscriptionActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return { ok: true as const, user, supabase };
}

/**
 * Cancel an active subscription. The profile.plan trigger reconciles the
 * member's plan to the next highest still-active subscription (or drops
 * them to basic if nothing remains).
 */
export async function cancelSubscription(
  id: string
): Promise<SubscriptionActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: sub, error: fetchErr } = await auth.supabase
    .from('subscriptions')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !sub) {
    return { ok: false, error: 'Abònman an pa jwenn.' };
  }
  if ((sub as { status: string }).status === 'cancelled') {
    return { ok: false, error: 'Abònman an deja anile.' };
  }

  const { error } = await auth.supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/users');
  return { ok: true };
}

/**
 * Add months to the end_date of an active subscription. Used to honour
 * support credits, promotional extensions, or admin-side bookkeeping
 * adjustments without forcing a new payment.
 */
export async function extendSubscription(
  id: string,
  monthsToAdd: number
): Promise<SubscriptionActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(monthsToAdd) || monthsToAdd <= 0 || monthsToAdd > 60) {
    return { ok: false, error: 'Kantite mwa a dwe ant 1 ak 60.' };
  }

  const { data: sub } = await auth.supabase
    .from('subscriptions')
    .select('id, end_date, status')
    .eq('id', id)
    .maybeSingle();

  const row = sub as { id: string; end_date: string | null; status: string } | null;
  if (!row) return { ok: false, error: 'Abònman an pa jwenn.' };
  if (row.status !== 'active') {
    return { ok: false, error: 'Sèlman abònman aktif yo ka ekstanjyone.' };
  }

  const base = row.end_date ? new Date(row.end_date) : new Date();
  base.setMonth(base.getMonth() + Math.round(monthsToAdd));

  const { error } = await auth.supabase
    .from('subscriptions')
    .update({
      end_date: base.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/subscriptions');
  return { ok: true };
}

/**
 * Mark a subscription as refunded — flips status to cancelled and appends
 * `_refunded` to the payment_reference for audit. Does not actually issue
 * money back; that's handled by the payment processor separately.
 */
export async function markSubscriptionRefunded(
  id: string
): Promise<SubscriptionActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: sub } = await auth.supabase
    .from('subscriptions')
    .select('id, payment_reference')
    .eq('id', id)
    .maybeSingle();
  const row = sub as {
    id: string;
    payment_reference: string | null;
  } | null;
  if (!row) return { ok: false, error: 'Abònman an pa jwenn.' };

  const newRef =
    row.payment_reference && !row.payment_reference.endsWith('_refunded')
      ? `${row.payment_reference}_refunded`
      : (row.payment_reference ?? `refunded_${Date.now()}`);

  const { error } = await auth.supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      payment_reference: newRef,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/subscriptions');
  return { ok: true };
}
