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
// and can create nothing on its own. But it is BAKED IN AT BUILD TIME, so if
// the deploy built without it, Stripe.js never loads and confirmPayment does
// nothing — the card looks accepted yet the PaymentIntent stays
// `requires_payment_method` and the plan never activates. Guard it loudly.
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

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
  // No key baked into this build → Stripe.js cannot load. Say so plainly
  // instead of showing a card form that silently fails on submit.
  if (!stripePromise) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.4} />
        <span>
          Peman an pa disponib pou kounye a (konfigirasyon Stripe la manke).
          Tanpri kontakte sipò a — nou ap ranje l touswit.
        </span>
      </div>
    );
  }
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

  // Triggered by the pay button's onClick — NOT a form submit. This card UI
  // renders INSIDE the checkout page's auth <form>, and HTML/React nested
  // forms are invalid: a nested submit bubbles to the outer form, which
  // navigates the page away before confirmPayment can run — leaving the
  // PaymentIntent stuck at `requires_payment_method` and bouncing the member
  // to pricing. Using a plain button + onClick keeps confirmation isolated.
  async function onSubmit() {
    if (!stripe || !elements) {
      // Stripe.js failed to initialise (bad/empty publishable key). Never let
      // the click do nothing — that is the silent trap that looked like the
      // payment "not passing".
      setError(
        'Sistèm peman an poko pare. Rechaje paj la; si l kontinye, kontakte sipò.'
      );
      return;
    }

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
    <div className="space-y-4">
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
        type="button"
        onClick={onSubmit}
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
    </div>
  );
}
