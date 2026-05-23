'use client';

import React from 'react';
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Lock,
  LockOpen,
  Trash2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  adminTogglePinTopic,
  adminToggleLockTopic,
  adminDeleteTopic,
} from './actions';

export default function TopicRowActions({
  id,
  pinned,
  locked,
}: {
  id: string;
  pinned: boolean;
  locked: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open && !confirmDelete) return;
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
      setConfirmDelete(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, confirmDelete]);

  async function run(name: 'pin' | 'lock' | 'delete') {
    setError(null);
    setPending(name);
    const res =
      name === 'pin'
        ? await adminTogglePinTopic(id)
        : name === 'lock'
          ? await adminToggleLockTopic(id)
          : await adminDeleteTopic(id);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setConfirmDelete(false);
  }

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-label="Aksyon yo"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="grid place-items-center w-8 h-8 rounded-lg bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 transition"
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={2.2} />
      </button>

      {open && !confirmDelete && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-cream-200 bg-white shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              run('pin');
            }}
            disabled={pending !== null}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gold-700 hover:bg-gold-50 disabled:opacity-60 transition text-left"
          >
            {pending === 'pin' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
            ) : pinned ? (
              <PinOff className="w-3.5 h-3.5" strokeWidth={2.2} />
            ) : (
              <Pin className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
            {pinned ? 'Retire pin' : 'Pin sou tèt'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              run('lock');
            }}
            disabled={pending !== null}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition text-left"
          >
            {pending === 'lock' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
            ) : locked ? (
              <LockOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
            ) : (
              <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
            {locked ? 'Reouvri' : 'Fèmen repons'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition text-left border-t border-cream-100"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            Efase sijè
          </button>
          {error && (
            <div className="px-3 py-2 text-[10px] text-rose-700 bg-rose-50 border-t border-rose-100 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.4} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <div
          className="absolute right-0 top-9 z-30 w-72 rounded-xl border border-rose-200 bg-white shadow-xl p-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-rose-800">
              Efase sijè a?
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="grid place-items-center w-6 h-6 rounded text-earth-600 hover:bg-cream-100"
            >
              <X className="w-3 h-3" strokeWidth={2.2} />
            </button>
          </div>
          <p className="text-[11px] text-earth-600 leading-relaxed mb-3">
            Tout repons yo ap efase tou. Aksyon sa pa ka anile.
          </p>
          {error && (
            <div className="mb-2 flex items-start gap-1 text-[11px] text-rose-700">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.4} />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={pending !== null}
              className="px-3 py-1.5 text-xs font-semibold text-earth-700 hover:text-ink"
            >
              Pa kounye a
            </button>
            <button
              type="button"
              onClick={() => run('delete')}
              disabled={pending !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white rounded-lg"
            >
              {pending === 'delete' && (
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
              )}
              Wi, efase
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
