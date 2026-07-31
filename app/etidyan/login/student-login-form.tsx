'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const SUSPENDED_MSG = 'Kont ou sispann. Kontakte sipò a pou plis enfòmasyon.';

export default function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only ever send them back into the student area (guards against an
  // open-redirect via a crafted ?redirect=).
  const rawRedirect = searchParams.get('redirect') || '/aprann';
  const redirect = rawRedirect.startsWith('/aprann') ? rawRedirect : '/aprann';
  const supabase = createClient();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // The portal is course-buyers-only: a valid account with no course gets a
  // dedicated message (with a link to buy) instead of a generic error.
  const [noCourses, setNoCourses] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNoCourses(false);
    setLoading(true);

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.user) {
      setLoading(false);
      const banned = /banned|user_banned/i.test(
        `${signInError?.message ?? ''} ${(signInError as { code?: string } | null)?.code ?? ''}`
      );
      setError(banned ? SUSPENDED_MSG : 'Imèl oswa modpas pa kòrèk.');
      return;
    }

    // Buyers only. Count this user's enrolments; no course = not a student.
    // If the check itself errors, fall through — the portal's own server-side
    // gate is the backstop and will bounce a non-buyer to the catalogue.
    const { count, error: enrErr } = await supabase
      .from('course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', signInData.user.id);

    if (!enrErr && (count ?? 0) === 0) {
      setLoading(false);
      setNoCourses(true);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} translate="no" className="notranslate space-y-5">
      <div>
        <label className="text-sm font-medium text-ink">Imèl</label>
        <div className="mt-1 relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
            strokeWidth={2.2}
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-forest-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            placeholder="ou@egzanp.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium text-ink">Modpas</label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-forest-700 font-medium hover:underline"
          >
            Bliye modpas?
          </Link>
        </div>
        <div className="mt-1 relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
            strokeWidth={2.2}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-forest-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            placeholder="••••••••"
          />
        </div>
      </div>

      {noCourses ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Kont sa a poko achte okenn kou.</p>
          <p className="mt-0.5 text-xs text-amber-800/90">
            Potay Etidyan an se pou moun ki achte kou. Achte youn pou w ka antre.
          </p>
          <Link
            href="/klas"
            className="mt-2 inline-flex items-center gap-1.5 text-forest-700 font-semibold underline"
          >
            Gade katalòg la
            <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
          </Link>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />}
        Konekte nan Potay la
      </button>
    </form>
  );
}
