'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  processCourseCheckout,
  type CourseCheckoutState,
} from './actions';

type Props = {
  slug: string;
  priceCents: number;
  isAuthenticated: boolean;
};

type Mode = 'login' | 'signup';

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Lightweight card-number formatter that inserts a space every 4 digits.
function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CourseCheckoutForm({
  slug,
  priceCents,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const action = processCourseCheckout.bind(null, slug);
  const [state, formAction] = useFormState<CourseCheckoutState, FormData>(
    action,
    {}
  );

  const [mode, setMode] = React.useState<Mode>('login');
  // Switch to login pane when the server suggests the email already exists.
  React.useEffect(() => {
    if (state.switchToLogin) setMode('login');
  }, [state.switchToLogin]);

  // After a successful purchase the server returns a redirectTo URL —
  // we drive a full-page nav so the freshly-issued session cookie
  // lands on the destination.
  React.useEffect(() => {
    if (state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state.redirectTo]);

  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');

  return (
    <form action={formAction} className="space-y-5">
      {/* Account section — hidden when already signed in */}
      {!isAuthenticated && (
        <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card space-y-4">
          <header className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-brand-700" strokeWidth={2.4} />
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Kont ou
              </h2>
            </div>
            <div className="inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition',
                  mode === 'login'
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-earth-600'
                )}
              >
                M gen yon kont
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition',
                  mode === 'signup'
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-earth-600'
                )}
              >
                Kreye yon kont
              </button>
            </div>
          </header>

          <input type="hidden" name="mode" value={mode} />

          {mode === 'signup' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Prenon" required>
                <input
                  type="text"
                  name="first_name"
                  className={inputClass}
                  placeholder="Jean"
                  required
                />
              </Field>
              <Field label="Non" required>
                <input
                  type="text"
                  name="last_name"
                  className={inputClass}
                  placeholder="Baptiste"
                  required
                />
              </Field>
            </div>
          )}

          <Field label="Imel" required>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
                strokeWidth={2.2}
              />
              <input
                type="email"
                name="email"
                required
                className={cn(inputClass, 'pl-9')}
                placeholder="ou@example.com"
              />
            </div>
          </Field>

          <Field
            label="Modpas"
            required
            help={mode === 'signup' ? 'Omwen 6 karaktè.' : undefined}
          >
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
                strokeWidth={2.2}
              />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className={cn(inputClass, 'pl-9')}
                placeholder="••••••••"
              />
            </div>
          </Field>
        </section>
      )}

      {/* Card section */}
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card space-y-4">
        <header className="inline-flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-brand-700" strokeWidth={2.4} />
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
            Detay kat la
          </h2>
        </header>

        <Field label="Non sou kat la" required>
          <input
            type="text"
            name="cardholder_name"
            required
            className={inputClass}
            placeholder="Jean Baptiste"
          />
        </Field>

        <Field label="Nimewo kat" required>
          <input
            type="text"
            name="card_number"
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className={cn(inputClass, 'font-mono tracking-wider')}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Dat ekspirasyon (MM/YY)" required>
            <input
              type="text"
              name="expiry"
              required
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className={cn(inputClass, 'font-mono')}
              placeholder="12/28"
              inputMode="numeric"
              autoComplete="cc-exp"
            />
          </Field>
          <Field label="CVC" required>
            <input
              type="text"
              name="cvc"
              required
              className={cn(inputClass, 'font-mono')}
              placeholder="123"
              maxLength={4}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </Field>
        </div>

        <p className="text-[11px] text-earth-500 inline-flex items-center gap-1.5">
          <Lock className="w-3 h-3" strokeWidth={2.4} />
          Tranzaksyon w sekirize. Nou pa kenbe okenn detay kat sou sèvè nou.
        </p>
      </section>

      {/* Submit + state */}
      <SubmitBar priceCents={priceCents} state={state} />
    </form>
  );
}

function SubmitBar({
  priceCents,
  state,
}: {
  priceCents: number;
  state: CourseCheckoutState;
}) {
  const { pending } = useFormStatus();
  return (
    <section className="space-y-3">
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white font-semibold px-6 py-4 rounded-full transition shadow-md text-base"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Lock className="w-4 h-4" strokeWidth={2.4} />
        )}
        Peye {dollars(priceCents)} epi jwenn aksè
      </button>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{state.error}</span>
        </div>
      )}
      {state.redirectTo && (
        <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 text-sm text-forest-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.4} />
          <span>Pèman pase. Mwen ap mennen w nan klas la…</span>
        </div>
      )}

      <p className="text-[11px] text-earth-500 text-center">
        Lè w peye, ou aksepte{' '}
        <Link href="/konfidansyalite" className="underline">
          kondisyon yo
        </Link>
        .
      </p>
    </section>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Field({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {help && <p className="text-[11px] text-earth-500 mt-1">{help}</p>}
    </label>
  );
}
