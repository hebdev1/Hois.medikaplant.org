'use client';

import React from 'react';
import { Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { adminDeleteReply } from '../actions';

export default function ReplyRowActions({ id }: { id: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    setError(null);
    setPending(true);
    const res = await adminDeleteReply(id);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirming(false);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Efase repons"
        className="grid place-items-center w-8 h-8 rounded-lg text-earth-500 hover:text-rose-700 hover:bg-rose-50 transition"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white rounded-lg"
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
        ) : (
          <Trash2 className="w-3 h-3" strokeWidth={2.4} />
        )}
        Efase
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        disabled={pending}
        aria-label="Anile"
        className="grid place-items-center w-7 h-7 rounded-lg text-earth-600 hover:bg-cream-100 transition"
      >
        <X className="w-3 h-3" strokeWidth={2.4} />
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-[10px] text-rose-700">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
          {error}
        </span>
      )}
    </div>
  );
}
