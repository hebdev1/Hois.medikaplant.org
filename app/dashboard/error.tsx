'use client';

/**
 * Dashboard error boundary. Catches unhandled errors in any /dashboard/*
 * server component or its children and shows a recoverable UI with the
 * actual message (so the user — and us — can see what failed instead of
 * Next.js's generic "Application error" screen).
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    // Surface to whatever frontend telemetry we add later
    // eslint-disable-next-line no-console
    console.error('[dashboard error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 md:p-8 shadow-card">
        <div className="flex items-start gap-3 mb-4">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <AlertTriangle className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Yon erè rive
            </h1>
            <p className="text-sm text-earth-600 mt-1">
              Paj la pa ka chaje kounye a. Ekip teknik la jwenn yon mesaj
              otomatik — eseye ankò nan kèk segond.
            </p>
          </div>
        </div>

        <details className="rounded-xl bg-cream-50 border border-cream-200 px-3 py-2 text-xs text-earth-700">
          <summary className="cursor-pointer font-semibold">
            Detay teknik
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug">
            {error.message || 'Erè san mesaj'}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        </details>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.4} />
            Eseye ankò
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-earth-700 hover:text-ink border border-cream-200 hover:border-forest-300 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
            Tounen
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-earth-700 hover:text-ink border border-cream-200 hover:border-forest-300 rounded-lg transition"
          >
            <Home className="w-3.5 h-3.5" strokeWidth={2.2} />
            Tablodebò
          </button>
        </div>
      </div>
    </div>
  );
}
