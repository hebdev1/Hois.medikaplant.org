'use client';

import React from 'react';
import {
  Mail,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  CalendarRange,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createMemberAccount } from '../actions';

const PLAN_OPTIONS: { value: 'basic' | 'premium' | 'vip'; label: string }[] = [
  { value: 'basic', label: 'Bazilik' },
  { value: 'premium', label: 'Sitwonèl' },
  { value: 'vip', label: 'Melis' },
];

export default function AddMemberForm() {
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [plan, setPlan] = React.useState<'basic' | 'premium' | 'vip'>('basic');
  const [years, setYears] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    email: string;
    emailSent: boolean;
    setupUrl: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createMemberAccount({
      email,
      firstName,
      lastName,
      plan,
      years,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult({ email: res.email, emailSent: res.emailSent, setupUrl: res.setupUrl });
  }

  async function onCopy() {
    if (!result?.setupUrl) return;
    try {
      await navigator.clipboard.writeText(result.setupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const el = document.getElementById('setup-url-output') as HTMLInputElement | null;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    }
  }

  function reset() {
    setEmail('');
    setFirstName('');
    setLastName('');
    setPlan('basic');
    setYears(1);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <section className="bg-white border border-forest-200 rounded-2xl p-5 md:p-6 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Kont lan kreye
            </h2>
            <p className="text-sm text-earth-600 mt-1">
              {result.emailSent ? (
                <>
                  Nou voye yon imèl sou <strong>{result.email}</strong> ak yon
                  lyen pou li chwazi modpas li epi konekte.
                </>
              ) : (
                <>
                  Kont lan kreye pou <strong>{result.email}</strong>, men imèl la
                  pa t rive pati. Pataje lyen anba a dirèkteman ak manm nan.
                </>
              )}
            </p>
          </div>
        </div>

        {result.setupUrl && (
          <div>
            <div className="text-[11px] font-semibold text-earth-600 mb-1">
              Lyen pou chwazi modpas (bak-ap — ekspire nan 1 èdtan)
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="setup-url-output"
                type="text"
                value={result.setupUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 px-3 py-2 text-xs font-mono bg-cream-50 border border-cream-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-forest-200"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
                      Kopye!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" strokeWidth={2.2} />
                      Kopye
                    </>
                  )}
                </button>
                <a
                  href={result.setupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-cream-50 text-earth-700 border border-cream-200 rounded-lg transition shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Ouvè
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-cream-200">
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-earth-700 rounded-lg transition"
          >
            Ajoute yon lòt manm
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Imèl" icon={Mail} required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            placeholder="manm@egzanp.com"
            className={inputClass}
          />
        </Field>
        <div /> {/* spacer */}
        <Field label="Prenon" icon={UserIcon} required>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="Marie"
            className={inputClass}
          />
        </Field>
        <Field label="Non" icon={UserIcon}>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Joseph"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-earth-700 mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
            Plan
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PLAN_OPTIONS.map((p) => {
              const active = p.value === plan;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlan(p.value)}
                  aria-pressed={active}
                  className={cn(
                    'px-2 py-2 rounded-xl border text-sm font-bold transition',
                    active
                      ? 'bg-forest-600 border-forest-600 text-cream-50'
                      : 'bg-white border-cream-200 text-earth-700 hover:border-forest-300'
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Kantite ane" icon={CalendarRange} required>
          <input
            type="number"
            min={1}
            max={10}
            value={years}
            onChange={(e) =>
              setYears(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
            }
            required
            className={inputClass}
          />
          <p className="text-[11px] text-earth-500 mt-1">
            Aksè gratis pou {years} ane (san peman).
          </p>
        </Field>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-100">
        <button
          type="submit"
          disabled={pending || email.trim().length === 0 || firstName.trim().length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />}
          Kreye kont lan epi voye imèl la
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 disabled:opacity-60';

function Field({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon: LucideIcon;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700 flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        {label}
        {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}
