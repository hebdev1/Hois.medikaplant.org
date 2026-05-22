'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { siteUrl } from '@/lib/site-url';
import { User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const planParam = (searchParams.get('plan') as 'basic' | 'premium' | 'vip' | null) ?? null;
  const supabase = createClient();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const postSignupDestination =
      redirectParam ||
      (planParam ? `/checkout?plan=${planParam}` : '/dashboard');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, intended_plan: planParam ?? 'basic' },
        // Anchor confirmation links to the canonical production URL so the
        // recipient lands on the right deploy even if they open the email
        // on a different device.
        emailRedirectTo: siteUrl(postSignupDestination),
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user && !data.session) {
      setSent(true);
      return;
    }

    if (data.session) {
      router.push(postSignupDestination);
      router.refresh();
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-brand-600 mx-auto mb-3" strokeWidth={2} />
        <h2 className="font-bold text-ink text-lg">Tcheke email ou!</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Nou voye yon lyen konfimasyon. Klike li pou aktive kont ou.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {planParam && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-800">
          Plan chwazi: <strong className="capitalize">Hoïs {planParam === 'basic' ? 'Bazilik' : planParam === 'premium' ? 'Sitwonèl' : 'Melis'}</strong>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-ink">Non konplè</label>
        <div className="mt-1 relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2.2} />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            placeholder="Jean Baptiste"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Email</label>
        <div className="mt-1 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2.2} />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            placeholder="ou@medikaplant.org"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Modpas</label>
        <div className="mt-1 relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2.2} />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            placeholder="Omwen 6 karaktè"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />}
        Kreye kont mwen
      </button>
    </form>
  );
}
