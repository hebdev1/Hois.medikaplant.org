'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Lock, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { processCheckout, type CheckoutState } from './actions';

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function SubmitButton({ amount }: { amount: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white px-6 py-4 rounded-xl font-semibold text-base transition shadow-lg shadow-brand-600/30"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          Ap trete pèman...
        </>
      ) : (
        <>
          <Lock className="w-4 h-4" strokeWidth={2.4} />
          Peye ${amount} an sekirite
        </>
      )}
    </button>
  );
}

export default function CheckoutForm({
  plan,
  amount,
}: {
  plan: 'basic' | 'premium' | 'vip';
  amount: number;
}) {
  const [state, formAction] = useFormState<CheckoutState, FormData>(processCheckout, {});
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="plan" value={plan} />

      <div>
        <label className="text-sm font-medium text-ink">Non sou kat la</label>
        <input
          type="text"
          name="cardholder_name"
          required
          autoComplete="cc-name"
          className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
          placeholder="Jean Baptiste"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Nimewo kat</label>
        <div className="mt-1 relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2.2} />
          <input
            type="text"
            name="card_number"
            required
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono tracking-wider"
            placeholder="4242 4242 4242 4242"
            maxLength={23}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-ink">Dat ekspirasyon</label>
          <input
            type="text"
            name="expiry"
            required
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono"
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">CVC</label>
          <input
            type="text"
            name="cvc"
            required
            inputMode="numeric"
            autoComplete="cc-csc"
            className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono"
            placeholder="123"
            maxLength={4}
          />
        </div>
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton amount={amount} />

      <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
        Pèman an sekirite · Anile nenpòt lè · Sipò 24/7
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        <strong>Mod demo:</strong> Nimewo kat la pa pwoseze. Itilize{' '}
        <code className="font-mono">4242 4242 4242 4242</code> ak nenpòt dat ekspirasyon nan lavni a.
      </div>
    </form>
  );
}
