'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Plus, Loader2, X, Trash2, Percent, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveCoupon, toggleCoupon, deleteCoupon } from './actions';

type Row = {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  amount: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
};

function discountLabel(r: Pick<Row, 'discount_type' | 'amount'>): string {
  if (r.discount_type === 'percent') return `${+r.amount}% rabè`;
  return `${(+r.amount).toFixed(2)} fiks`;
}

function isExpired(iso: string | null): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

export default function CouponsAdmin({ coupons }: { coupons: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Row | null | 'new'>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function onToggle(id: string) {
    setBusyId(id);
    await toggleCoupon(id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Ticket className="w-3.5 h-3.5" strokeWidth={2.2} />
            Komès · Koupon
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Kòd rabè
          </h1>
          <p className="mt-1.5 text-sm text-earth-600">
            {coupons.length} koupon · pousantaj oswa montan fiks · pou boutik la
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Nouvo koupon
        </button>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen koupon. Kreye premye kòd rabè a.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {coupons.map((c) => {
              const expired = isExpired(c.expires_at);
              const usedUp = c.max_uses !== null && c.used_count >= c.max_uses;
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5">
                  <span
                    className={cn(
                      'grid place-items-center w-10 h-10 rounded-xl shrink-0',
                      c.discount_type === 'percent'
                        ? 'bg-forest-100 text-forest-700'
                        : 'bg-gold-100 text-gold-700'
                    )}
                  >
                    {c.discount_type === 'percent' ? (
                      <Percent className="w-4 h-4" strokeWidth={2.4} />
                    ) : (
                      <DollarSign className="w-4 h-4" strokeWidth={2.4} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-ink tracking-wide">{c.code}</span>
                      <span className="text-[11px] font-semibold text-earth-600">
                        {discountLabel(c)}
                      </span>
                      {expired && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Ekspire
                        </span>
                      )}
                      {usedUp && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Limit rive
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-earth-500 truncate">
                      {c.description || '—'}
                      {c.max_uses !== null && (
                        <span className="ml-2">
                          · {c.used_count}/{c.max_uses} itilize
                        </span>
                      )}
                      {c.expires_at && (
                        <span className="ml-2">
                          · jiska {new Date(c.expires_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggle(c.id)}
                    disabled={busyId === c.id}
                    aria-pressed={c.active}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
                      c.active ? 'bg-forest-600' : 'bg-cream-300'
                    )}
                    title={c.active ? 'Aktif — klike pou dezaktive' : 'Dezaktive — klike pou aktive'}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        c.active && 'translate-x-5'
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                  >
                    Modifye
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <CouponModal
          coupon={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CouponModal({
  coupon,
  onClose,
  onChanged,
}: {
  coupon: Row | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [code, setCode] = React.useState(coupon?.code ?? '');
  const [description, setDescription] = React.useState(coupon?.description ?? '');
  const [discountType, setDiscountType] = React.useState<'percent' | 'fixed'>(
    coupon?.discount_type ?? 'percent'
  );
  const [amount, setAmount] = React.useState(coupon ? String(+coupon.amount) : '10');
  const [active, setActive] = React.useState(coupon?.active ?? true);
  const [expiresAt, setExpiresAt] = React.useState(
    coupon?.expires_at ? coupon.expires_at.slice(0, 10) : ''
  );
  const [maxUses, setMaxUses] = React.useState(
    coupon?.max_uses !== null && coupon?.max_uses !== undefined ? String(coupon.max_uses) : ''
  );
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function saveAndClose() {
    setBusy(true);
    setErr(null);
    const res = await saveCoupon({
      id: coupon?.id,
      code,
      description,
      discount_type: discountType,
      amount: Number(amount),
      active,
      expires_at: expiresAt || null,
      max_uses: maxUses ? Number(maxUses) : null,
    });
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  async function remove() {
    if (!coupon?.id) return;
    setBusy(true);
    const res = await deleteCoupon(coupon.id);
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';
  const lblCls = 'text-[11px] font-bold uppercase tracking-wider text-earth-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fèmen"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur">
          <h2 className="font-display text-lg font-bold text-ink">
            {coupon ? 'Modifye koupon' : 'Nouvo koupon'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fèmen"
            className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block">
            <span className={lblCls}>Kòd</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={`${inputCls} font-mono tracking-wide`}
              placeholder="RANTRE20"
            />
          </label>

          <label className="block">
            <span className={lblCls}>Deskripsyon (opsyonèl)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              placeholder="20% sou tout tizán yo"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lblCls}>Tip rabè</span>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                className={inputCls}
              >
                <option value="percent">Pousantaj (%)</option>
                <option value="fixed">Montan fiks</option>
              </select>
            </label>
            <label className="block">
              <span className={lblCls}>
                {discountType === 'percent' ? 'Pousantaj' : 'Montan'}
              </span>
              <input
                type="number"
                min={0}
                max={discountType === 'percent' ? 100 : undefined}
                step={discountType === 'percent' ? 1 : 0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lblCls}>Dat ekspirasyon (opsyonèl)</span>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={lblCls}>Limit itilizasyon (opsyonèl)</span>
              <input
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className={inputCls}
                placeholder="san limit"
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-cream-300 text-forest-600 focus:ring-forest-200"
            />
            <span className="text-sm font-semibold text-ink">Aktif</span>
          </label>

          {err && <p className="text-xs text-rose-700">{err}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {coupon ? (
              !confirmDel ? (
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-sm font-semibold transition"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.2} /> Efase
                </button>
              ) : (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={busy}
                    className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-60"
                  >
                    Konfime
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(false)}
                    className="px-2 text-sm text-earth-500"
                  >
                    Anile
                  </button>
                </span>
              )
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={saveAndClose}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Anrejistre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
