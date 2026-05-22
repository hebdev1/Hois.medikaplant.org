'use client';

import React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Loader2,
  Lock,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  MapPin,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { processCheckout, type CheckoutState } from './actions';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'signup';

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function SubmitButton({
  amount,
  signedIn,
  mode,
}: {
  amount: number;
  signedIn: boolean;
  mode: Mode;
}) {
  const { pending } = useFormStatus();
  const label = signedIn
    ? `Peye $${amount} an sekirite`
    : mode === 'signup'
      ? `Kreye kont epi peye $${amount}`
      : `Konekte epi peye $${amount}`;
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white px-6 py-4 rounded-xl font-semibold text-base transition shadow-lg shadow-brand-600/30"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          Ap trete…
        </>
      ) : (
        <>
          <Lock className="w-4 h-4" strokeWidth={2.4} />
          {label}
        </>
      )}
    </button>
  );
}

export default function CheckoutForm({
  plan,
  amount,
  userEmail,
}: {
  plan: 'basic' | 'premium' | 'vip';
  amount: number;
  userEmail: string | null;
}) {
  const [state, formAction] = useFormState<CheckoutState, FormData>(
    processCheckout,
    {}
  );
  const signedIn = Boolean(userEmail);

  const [mode, setMode] = React.useState<Mode>('login');
  const [showPw, setShowPw] = React.useState(false);
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [redirecting, setRedirecting] = React.useState(false);

  // If the server tells us to switch tabs (e.g. "account already exists"
  // during signup), honor that.
  React.useEffect(() => {
    if (state.switchToLogin) setMode('login');
  }, [state.switchToLogin]);

  // On successful checkout the action returns a redirectTo URL. Force a
  // full-page navigation so the destination page boots with the freshly
  // written session cookie in scope. router.push would re-use the existing
  // client cache and occasionally render /dashboard as anonymous before the
  // middleware kicks in.
  React.useEffect(() => {
    if (state.redirectTo) {
      setRedirecting(true);
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  // Success state — show a clean confirmation while the browser navigates
  // away. Otherwise the form would briefly show "Ap trete…" then vanish.
  if (redirecting) {
    return (
      <div className="text-center py-12">
        <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-green-100 text-green-700 mb-4 mx-auto">
          <CheckCircle2 className="w-7 h-7" strokeWidth={2.2} />
        </span>
        <h2 className="font-display text-2xl font-bold text-ink">
          Pèman pase!
        </h2>
        <p className="text-sm text-ink-muted mt-2 max-w-xs mx-auto leading-relaxed">
          Plan ou aktif kounye a. N ap mennen ou nan tablodebò ou…
        </p>
        <Loader2
          className="w-5 h-5 animate-spin text-brand-600 mx-auto mt-4"
          strokeWidth={2.2}
        />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="mode" value={mode} />

      {/* ── Step 1: Identity ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">
            <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">
              1
            </span>
            Idantite
          </h2>
          {signedIn && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
              <ShieldCheck className="w-3 h-3" strokeWidth={2.4} />
              Konekte
            </span>
          )}
        </div>

        {signedIn ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white border border-slate-200 text-brand-700 shrink-0">
                <UserIcon className="w-4 h-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="text-xs text-ink-muted">Kont aktif</div>
                <div className="text-sm font-semibold text-ink truncate">
                  {userEmail}
                </div>
              </div>
            </div>
            <Link
              href={`/auth/login?redirect=/checkout?plan=${plan}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-ink transition"
              title="Konekte ak yon lòt kont"
            >
              <LogOut className="w-3 h-3" strokeWidth={2.4} />
              Chanje
            </Link>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={cn(
                  'px-3 py-2 text-sm font-semibold rounded-lg transition',
                  mode === 'login'
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                Mwen gen kont
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={cn(
                  'px-3 py-2 text-sm font-semibold rounded-lg transition',
                  mode === 'signup'
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                Mwen pa gen kont
              </button>
            </div>

            {/* Signup-only fields */}
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Prenon
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    minLength={2}
                    autoComplete="given-name"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Non
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    minLength={2}
                    autoComplete="family-name"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                    placeholder="Baptiste"
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Imel
              </label>
              <div className="mt-1 relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
                  strokeWidth={2.2}
                />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  placeholder="ou@medikaplant.org"
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  Modpas
                </label>
                {mode === 'login' && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] text-brand-700 font-semibold hover:underline"
                  >
                    Bliye modpas?
                  </Link>
                )}
              </div>
              <div className="mt-1 relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
                  strokeWidth={2.2}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  placeholder={mode === 'login' ? '••••••••' : 'Omwen 6 karaktè'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink rounded transition"
                  aria-label={showPw ? 'Kache modpas' : 'Montre modpas'}
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Country gate — only required when creating an account */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  Peyi
                </label>
                <div className="mt-1 relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
                    strokeWidth={2.2}
                  />
                  <select
                    name="country"
                    required
                    defaultValue="HT"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition appearance-none bg-white"
                  >
                    <option value="HT">🇭🇹 Ayiti (Haiti)</option>
                    <option value="OTHER">Lòt peyi (pa aksepte)</option>
                  </select>
                </div>
                <p className="mt-1.5 text-[11px] text-ink-muted">
                  Plan sa yo disponib <strong>sèlman pou manm ki nan Ayiti</strong>.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Step 2: Payment ─────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-ink mb-4">
          <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">
            2
          </span>
          Enfòmasyon pèman
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Non sou kat la
            </label>
            <input
              type="text"
              name="cardholder_name"
              required
              autoComplete="cc-name"
              className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
              placeholder="Jean Baptiste"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Nimewo kat
            </label>
            <div className="mt-1 relative">
              <CreditCard
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
                strokeWidth={2.2}
              />
              <input
                type="text"
                name="card_number"
                required
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono tracking-wider"
                placeholder="4242 4242 4242 4242"
                maxLength={23}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Dat ekspirasyon
              </label>
              <input
                type="text"
                name="expiry"
                required
                inputMode="numeric"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                CVC
              </label>
              <input
                type="text"
                name="cvc"
                required
                inputMode="numeric"
                autoComplete="cc-csc"
                className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition font-mono"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
        </div>
      </section>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            className="w-4 h-4 mt-0.5 shrink-0"
            strokeWidth={2.2}
          />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton amount={amount} signedIn={signedIn} mode={mode} />

      <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
        Pèman an sekirite · Anile nenpòt lè · Sipò 24/7
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        <strong>Mod demo:</strong> Nimewo kat la pa pwoseze. Itilize{' '}
        <code className="font-mono">4242 4242 4242 4242</code> ak nenpòt dat
        ekspirasyon nan lavni a.
      </div>
    </form>
  );
}
