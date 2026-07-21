'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type SessionState =
  | { kind: 'pending' }
  | { kind: 'ready' }
  | { kind: 'no-session' };

export default function ResetPasswordForm() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();

  // The recovery link from Supabase delivers a session via URL hash. We wait
  // for onAuthStateChange to fire with the 'PASSWORD_RECOVERY' event before
  // letting the user submit a new password, otherwise updateUser() would 401.
  const [session, setSession] = React.useState<SessionState>({ kind: 'pending' });
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    // Subscribe first so we capture the PASSWORD_RECOVERY event whenever it lands
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!alive) return;
      if (event === 'PASSWORD_RECOVERY' || (s && event === 'SIGNED_IN')) {
        setSession({ kind: 'ready' });
      }
    });

    // Path A — direct-link flow from the custom email hook. The button
    // in the email now sends users to this page with token_hash + type
    // in the query string; we exchange them for a session via verifyOtp
    // so the rest of this component can call updateUser() against a real
    // recovery session. Falling back to the legacy hash-based flow
    // (Path B) is automatic if these params aren't present.
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    if (tokenHash && (type === 'recovery' || type === 'magiclink')) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type })
        .then(({ data, error }) => {
          if (!alive) return;
          if (error || !data.session) {
            setSession({ kind: 'no-session' });
            return;
          }
          setSession({ kind: 'ready' });
          // Strip the token from the URL so a refresh doesn't try to
          // re-verify (which would fail — tokens are single-use).
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        });
      return () => {
        alive = false;
        sub.subscription.unsubscribe();
      };
    }

    // Path B — legacy hash-based flow. Used for any bookmarked/in-flight
    // links from before the direct-link migration. Supabase's client
    // parses the hash automatically; we just need to wait for the
    // resulting SIGNED_IN / PASSWORD_RECOVERY event or check the existing
    // session if it already landed.
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) {
        setSession({ kind: 'ready' });
      } else {
        // Give the hash-parse a beat before giving up
        setTimeout(() => {
          if (!alive) return;
          setSession((curr) => (curr.kind === 'pending' ? { kind: 'no-session' } : curr));
        }, 1200);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Modpas la dwe gen omwen 8 karaktè.');
      return;
    }
    if (password !== confirm) {
      setError('De modpas yo pa matche.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    // Wait a beat so the user reads the confirmation, then go home
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  if (session.kind === 'pending') {
    return (
      <div className="rounded-2xl border border-cream-200 bg-cream-50 p-5 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand-700 mx-auto mb-2" strokeWidth={2.2} />
        <p className="text-sm text-ink-muted">Verifye lyen ou…</p>
      </div>
    );
  }

  if (session.kind === 'no-session') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" strokeWidth={2.4} />
          Lyen an pa valid oswa li ekspire
        </h2>
        <p className="text-sm text-red-700 mt-2 leading-relaxed">
          Lyen rekiperasyon ekspire apre 1 èdtan. Tanpri retounen sou paj{' '}
          <a
            href="/auth/forgot-password"
            className="font-semibold underline hover:no-underline"
          >
            Bliye modpas
          </a>{' '}
          pou jwenn yon nouvo.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-green-100 text-green-700 mb-3 mx-auto">
          <CheckCircle2 className="w-6 h-6" strokeWidth={2.2} />
        </span>
        <h2 className="font-bold text-ink">Modpas chanje!</h2>
        <p className="text-sm text-ink-muted mt-1">
          N ap mennen ou nan tablodebò a…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} translate="no" className="notranslate space-y-5">
      <div>
        <label className="text-sm font-medium text-ink">Nouvo modpas</label>
        <div className="mt-1 relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
            strokeWidth={2.2}
          />
          <input
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Omwen 8 karaktè"
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink rounded transition"
            aria-label={show ? 'Kache modpas' : 'Montre modpas'}
          >
            {show ? (
              <EyeOff className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Eye className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink">
          Konfime nouvo modpas
        </label>
        <div className="mt-1 relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
            strokeWidth={2.2}
          />
          <input
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repete modpas la"
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
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:brightness-110 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition shadow-md"
      >
        {submitting && (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        )}
        Anrejistre nouvo modpas
      </button>
    </form>
  );
}
