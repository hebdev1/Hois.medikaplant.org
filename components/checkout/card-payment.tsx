'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { hasActiveSubscription } from '@/app/checkout/elements-actions';

// The publishable key is meant to be public — it only identifies the account
// and can create nothing on its own.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

type Props = {
  /** From createPlanIntent / createCourseIntent. */
  clientSecret: string;
  /** Where to go once the card is actually accepted. */
  returnPath: string;
  amountLabel: string;
};

/**
 * On-page card fields. The inputs are rendered by Stripe inside its own
 * iframe, so the card number never touches our server — but visually they sit
 * in our form like any classic checkout.
 *
 * Redirect happens ONLY when Stripe confirms the payment. A declined card
 * leaves the member on this page with the reason shown.
 */
export default function CardPayment(props: Props) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#65881A',
            colorText: '#1c2a0a',
            borderRadius: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        },
      }}
    >
      <CardForm {...props} />
    </Elements>
  );
}

function CardForm({ returnPath, amountLabel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = React.useState(false);
  const [activating, setActivating] = React.useState(false);
  // Whether every card field is filled in. Driven by the PaymentElement's
  // own change event, so we can require completion before charging.
  const [cardComplete, setCardComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Require the card fields to be filled first. This blocks a submit on an
    // empty form with a clear message instead of anything else happening.
    if (!cardComplete) {
      setError('Tanpri ranpli tout enfòmasyon kat la anvan w peye.');
      return;
    }

    setPending(true);
    setError(null);

    // `if_required` keeps the member on this page unless the bank demands a
    // 3-D Secure step, in which case Stripe handles the detour and comes back.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + returnPath },
      redirect: 'if_required',
    });

    if (stripeError) {
      // Declined / invalid card: show why and stay put — no redirect.
      setError(stripeError.message ?? 'Peman an pa pase.');
      setPending(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Paid. The plan is activated by the webhook, which lands a moment
      // later — so wait for it here rather than navigating straight to the
      // dashboard, where the no-active-plan gate would bounce us to the
      // pricing section before the subscription row exists.
      setActivating(true);
      for (let i = 0; i < 12; i++) {
        if (await hasActiveSubscription()) {
          window.location.assign(returnPath);
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      // Timed out waiting (~18s). The payment is done and the webhook will
      // still land; go anyway rather than trapping the member here.
      window.location.assign(returnPath);
      return;
    }

    setError('Peman an pa konfime. Eseye yon lòt kat.');
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement
        options={{ layout: 'tabs' }}
        onChange={(ev) => {
          setCardComplete(ev.complete);
          if (ev.complete) setError(null);
        }}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || pending || activating}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white font-semibold px-6 py-4 rounded-xl transition shadow-lg"
      >
        {activating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            N ap aktive plan ou…
          </>
        ) : pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            Ap trete peman an…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" strokeWidth={2.4} />
            Peye {amountLabel}
          </>
        )}
      </button>
    </form>
  );
}
