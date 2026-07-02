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

// Chunk-load errors show up under several names depending on the
// bundler + browser version. Match liberally so we auto-reload for all
// of them and never surface the confusing "Application error" screen
// for what's really just a stale-cache problem.
function isChunkLoadError(err: Error): boolean {
  const name = err?.name ?? '';
  const msg = err?.message ?? '';
  return (
    name === 'ChunkLoadError' ||
    /loading chunk \d+ failed/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg)
  );
}

// DOM mutation errors: usually the result of Google Translate rewriting
// text nodes with <font> wrappers, so React can no longer find the
// reference node it's trying to update. A hard reload gives React a
// fresh unhydrated tree that the browser extension can start over on.
function isDomMutationError(err: Error): boolean {
  const msg = err?.message ?? '';
  return (
    /insertBefore.*not a child/i.test(msg) ||
    /removeChild.*not a child/i.test(msg) ||
    /the node before which the new node is to be inserted is not a child/i.test(msg)
  );
}

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

    // Auto-recover from chunk-load errors. These fire when a fresh deploy
    // invalidates the JS chunks the browser cached — clicking any Link
    // triggers a dynamic import that 404s, React catches it, we land
    // here. `reset()` won't help because the module is still gone; a
    // hard reload fetches the new HTML + fresh chunk manifest and the
    // navigation continues transparently.
    if (isChunkLoadError(error) || isDomMutationError(error)) {
      window.location.reload();
    }
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
