'use client';

import React from 'react';
import {
  MoreHorizontal,
  Ban,
  Plus,
  RotateCcw,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  cancelSubscription,
  extendSubscription,
  markSubscriptionRefunded,
} from './actions';

type Variant = 'cancel' | 'extend' | 'refund' | null;

export default function SubscriptionActions({
  id,
  status,
}: {
  id: string;
  status: 'active' | 'cancelled' | 'expired';
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<Variant>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [months, setMonths] = React.useState(1);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Click-outside closes the dropdown
  React.useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  async function run(variant: Variant) {
    if (!variant) return;
    setPending(true);
    setError(null);
    let res;
    if (variant === 'cancel') {
      res = await cancelSubscription(id);
    } else if (variant === 'extend') {
      res = await extendSubscription(id, months);
    } else {
      res = await markSubscriptionRefunded(id);
    }
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirm(null);
    setMenuOpen(false);
  }

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-label="Aksyon yo"
        onClick={() => setMenuOpen((v) => !v)}
        className="grid place-items-center w-8 h-8 rounded-lg bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 transition"
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={2.2} />
      </button>

      {menuOpen && !confirm && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-cream-200 bg-white shadow-xl overflow-hidden">
          <button
            type="button"
            disabled={status !== 'active'}
            onClick={() => setConfirm('cancel')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-left"
          >
            <Ban className="w-3.5 h-3.5" strokeWidth={2.2} />
            Anile abònman
          </button>
          <button
            type="button"
            disabled={status !== 'active'}
            onClick={() => setConfirm('extend')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-forest-700 hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-left"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
            Ekstanjyone
          </button>
          <button
            type="button"
            onClick={() => setConfirm('refund')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition text-left border-t border-cream-100"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.2} />
            Make refonde
          </button>
        </div>
      )}

      {confirm && (
        <div className="absolute right-0 top-9 z-30 w-72 rounded-xl border border-cream-200 bg-white shadow-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-ink">
              {confirm === 'cancel' && 'Anile abònman an?'}
              {confirm === 'extend' && 'Ekstanjyone abònman an'}
              {confirm === 'refund' && 'Make kòm refonde?'}
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirm(null);
                setError(null);
              }}
              className="grid place-items-center w-6 h-6 rounded text-earth-600 hover:bg-cream-100 transition"
              aria-label="Fèmen"
            >
              <X className="w-3 h-3" strokeWidth={2.2} />
            </button>
          </div>

          {confirm === 'cancel' && (
            <p className="text-[11px] text-earth-600 leading-relaxed mb-3">
              Plan manm nan ap ajiste sou pi gwo abònman ki rete aktif (oswa
              Bazilik si pa gen okenn).
            </p>
          )}
          {confirm === 'refund' && (
            <p className="text-[11px] text-earth-600 leading-relaxed mb-3">
              Sa make liy nan kòm anile epi mete{' '}
              <code className="bg-cream-100 px-1 rounded">_refunded</code> sou
              referans pèman an. Refon real la fèt nan pwosesè pèman an.
            </p>
          )}
          {confirm === 'extend' && (
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-earth-700 mb-1">
                Mwa pou ajoute
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={months}
                onChange={(e) =>
                  setMonths(Math.max(1, Math.min(60, Number(e.target.value) || 1)))
                }
                className="w-full px-2.5 py-1.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
              />
              <p className="mt-1 text-[10px] text-earth-500">
                Ajoute kantite mwa sa nan dat ekspirasyon aktyèl la.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-2 flex items-start gap-1 text-[11px] text-rose-700">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.4} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirm(null);
                setError(null);
              }}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-semibold text-earth-700 hover:text-ink rounded-lg transition"
            >
              Pa kounye a
            </button>
            <button
              type="button"
              onClick={() => run(confirm)}
              disabled={pending}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition disabled:opacity-60',
                confirm === 'cancel'
                  ? 'bg-rose-700 hover:bg-rose-800 text-white'
                  : confirm === 'refund'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-forest-700 hover:bg-forest-800 text-white'
              )}
            >
              {pending && (
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
              )}
              {confirm === 'cancel' && 'Anile abònman'}
              {confirm === 'extend' && `Ajoute ${months} mwa`}
              {confirm === 'refund' && 'Make refonde'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
