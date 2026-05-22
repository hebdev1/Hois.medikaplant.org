'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { siteUrl } from '@/lib/site-url';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ForgotPasswordForm() {
  const supabase = React.useMemo(() => createClient(), []);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleaned = email.trim().toLowerCase();
    if (!cleaned) {
      setError('Antre imel ou.');
      setLoading(false);
      return;
    }

    // Use the canonical site URL so the recovery link always points at the
    // production domain — never at localhost when the user opens the email
    // on a different device, and never at a stale preview deploy.
    const { error } = await supabase.auth.resetPasswordForEmail(cleaned, {
      redirectTo: siteUrl('/auth/reset-password'),
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-green-100 text-green-700 mb-3 mx-auto">
          <CheckCircle2 className="w-6 h-6" strokeWidth={2.2} />
        </span>
        <h2 className="font-bold text-ink">Tcheke bwat imel ou</h2>
        <p className="text-sm text-ink-muted mt-1 leading-relaxed">
          Nou voye yon lyen sou <strong className="text-ink">{email}</strong>.
          Klike sou li pou ou ka chwazi yon nouvo modpas. Lyen an ekspire nan
          1 èdtan.
        </p>
        <p className="text-[11px] text-ink-muted mt-3">
          Pa wè anyen? Tcheke katye spam la oswa{' '}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setError(null);
            }}
            className="text-brand-700 font-medium hover:underline"
          >
            eseye yon lòt imel
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-ink">Imel</label>
        <div className="mt-1 relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
            strokeWidth={2.2}
          />
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ou@medikaplant.org"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        )}
        Voye lyen rekiperasyon
      </button>
    </form>
  );
}
