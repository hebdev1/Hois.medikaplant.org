'use client';

import React from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { createPortalSession } from '@/app/checkout/stripe-actions';

/**
 * Opens the Stripe Billing Portal, where the member can change their card,
 * cancel, or download invoices without the founder having to do anything.
 * Only meaningful once they have paid at least once (Stripe customer exists).
 */
export default function BillingPortalButton() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function open() {
    setPending(true);
    setError(null);
    const res = await createPortalSession();
    if (res.url) {
      window.location.href = res.url;
      return;
    }
    setError(res.error ?? 'Pa ka louvri jesyon abònman an.');
    setPending(false);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-ink">Abònman ou</div>
        <div className="text-xs text-earth-600 mt-0.5">
          Chanje kat ou, wè fakti w, oswa anile abònman an.
        </div>
        {error && (
          <p className="mt-1 text-[11px] text-rose-700 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 rounded-lg transition w-fit"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        Jere abònman
      </button>
    </div>
  );
}
