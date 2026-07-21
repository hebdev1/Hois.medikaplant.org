'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { signInAsAdmin, type AdminLoginState } from './actions';

export default function AdminLoginForm() {
  const [state, action] = useFormState<AdminLoginState, FormData>(signInAsAdmin, {});
  const [showPw, setShowPw] = React.useState(false);

  return (
    <form action={action} translate="no" className="notranslate space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-[11px] font-bold uppercase tracking-wider text-earth-700 mb-1.5"
        >
          Imel administratè
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
            strokeWidth={2}
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="admin@medikaplant.org"
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400 transition"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[11px] font-bold uppercase tracking-wider text-earth-700 mb-1.5"
        >
          Modpas
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
            strokeWidth={2}
          />
          <input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400 transition"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-earth-500 hover:text-ink rounded transition"
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

      {state.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-ink hover:bg-ink/90 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 rounded-lg transition shadow-sm"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
          Verifye…
        </>
      ) : (
        <>
          Antre nan panèl admin
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        </>
      )}
    </button>
  );
}
