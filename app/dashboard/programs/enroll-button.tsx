'use client';

import React from 'react';
import { ChevronRight, Loader2, AlertCircle, Lock } from 'lucide-react';
import { enrollInProgram } from './actions';

export default function EnrollButton({
  programId,
  locked,
  lockReason,
  isCurrent,
}: {
  programId: string;
  locked: boolean;
  lockReason?: string;
  isCurrent: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-forest-100 text-forest-700">
        Pwotokòl aktif
      </span>
    );
  }

  if (locked) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-cream-100 text-earth-600 border border-cream-200"
        title={lockReason}
      >
        <Lock className="w-3 h-3" strokeWidth={2.4} />
        {lockReason ?? 'Plan ki pi wo'}
      </span>
    );
  }

  async function start() {
    if (
      !window.confirm(
        'Èske w vle kòmanse pwotokòl sa a? Si w deja gen yon pwotokòl aktif, li pral otomatikman mete sou pòz jiskaske w retounen sou li.'
      )
    ) {
      return;
    }
    setError(null);
    setPending(true);
    const res = await enrollInProgram(programId);
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gold-400 hover:bg-gold-500 disabled:opacity-60 text-ink transition"
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
        ) : null}
        Eksplore
        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-[10px] text-rose-700">
          <AlertCircle className="w-2.5 h-2.5" strokeWidth={2.4} />
          {error}
        </span>
      )}
    </div>
  );
}
