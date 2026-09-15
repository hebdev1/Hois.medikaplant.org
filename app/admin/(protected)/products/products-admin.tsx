'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Loader2, X, Trash2, Star, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveProduct, toggleProductFlag, deleteProduct } from './actions';

type Row = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  botanical: string | null;
  description: string | null;
  price: number;
  old_price: number | null;
  currency: string;
  shipping_note: string | null;
  image_url: string | null;
  plan_recommendation: 'basic' | 'premium' | 'vip' | null;
  featured: boolean;
  active: boolean;
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

const CURRENCIES = ['EUR', 'USD', 'HTG', 'CAD'] as const;

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function ProductsAdmin({ products }: { products: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Row | null | 'new'>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function onToggle(id: string, field: 'featured' | 'active') {
    setBusyId(id + field);
    await toggleProductFlag(id, field);
    setBusyId(null);
    router.refresh();
  }

  const activeCount = products.filter((p) => p.active).length;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2.2} />
            Komès · Pwodwi Shop
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Katalòg pwodwi
          </h1>
          <p className="mt-1.5 text-sm text-earth-600">
            {products.length} pwodwi · {activeCount} aktif · tizán ak remèd natirèl
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Nouvo pwodwi
        </button>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {products.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen pwodwi nan katalòg la.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 md:px-5 py-3">
                <div className="w-14 h-14 rounded-xl bg-cream-100 overflow-hidden shrink-0 grid place-items-center">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Leaf className="w-5 h-5 text-earth-400" strokeWidth={2} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink truncate">{p.name}</span>
                    {p.plan_recommendation && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        {PLAN_LABEL[p.plan_recommendation] ?? p.plan_recommendation}
                      </span>
                    )}
                    {!p.active && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600">
                        Kache
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-earth-500 truncate">
                    <span className="font-semibold text-earth-700">
                      {money(+p.price, p.currency)}
                    </span>
                    {p.old_price ? (
                      <span className="ml-1.5 line-through text-earth-400">
                        {money(+p.old_price, p.currency)}
                      </span>
                    ) : null}
                    {p.tagline ? <span className="ml-2">· {p.tagline}</span> : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggle(p.id, 'featured')}
                  disabled={busyId === p.id + 'featured'}
                  aria-pressed={p.featured}
                  title={p.featured ? 'Vedèt — klike pou retire' : 'Klike pou mete vedèt'}
                  className={cn(
                    'grid place-items-center w-8 h-8 rounded-lg transition shrink-0 disabled:opacity-50',
                    p.featured
                      ? 'bg-gold-100 text-gold-700'
                      : 'text-earth-400 hover:bg-cream-100'
                  )}
                >
                  <Star className="w-4 h-4" strokeWidth={2.2} fill={p.featured ? 'currentColor' : 'none'} />
                </button>

                <button
                  type="button"
                  onClick={() => onToggle(p.id, 'active')}
                  disabled={busyId === p.id + 'active'}
                  aria-pressed={p.active}
                  title={p.active ? 'Aktif — klike pou kache' : 'Kache — klike pou aktive'}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
                    p.active ? 'bg-forest-600' : 'bg-cream-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      p.active && 'translate-x-5'
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                >
                  Modifye
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <ProductModal
          product={editing === 'new' ? null : editing}
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

function ProductModal({
  product,
  onClose,
  onChanged,
}: {
  product: Row | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = React.useState(product?.name ?? '');
  const [slug, setSlug] = React.useState(product?.slug ?? '');
  const [tagline, setTagline] = React.useState(product?.tagline ?? '');
  const [botanical, setBotanical] = React.useState(product?.botanical ?? '');
  const [description, setDescription] = React.useState(product?.description ?? '');
  const [price, setPrice] = React.useState(product ? String(+product.price) : '');
  const [oldPrice, setOldPrice] = React.useState(
    product?.old_price != null ? String(+product.old_price) : ''
  );
  const [currency, setCurrency] = React.useState(product?.currency ?? 'EUR');
  const [shipping, setShipping] = React.useState(product?.shipping_note ?? '');
  const [imageUrl, setImageUrl] = React.useState(product?.image_url ?? '');
  const [plan, setPlan] = React.useState<string>(product?.plan_recommendation ?? '');
  const [featured, setFeatured] = React.useState(product?.featured ?? false);
  const [active, setActive] = React.useState(product?.active ?? true);
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function saveAndClose() {
    setBusy(true);
    setErr(null);
    const res = await saveProduct({
      id: product?.id,
      name,
      slug,
      tagline,
      botanical,
      description,
      price,
      old_price: oldPrice || null,
      currency,
      shipping_note: shipping,
      image_url: imageUrl,
      plan_recommendation: plan || null,
      featured,
      active,
    });
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  async function remove() {
    if (!product?.id) return;
    setBusy(true);
    const res = await deleteProduct(product.id);
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
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="font-display text-lg font-bold text-ink">
            {product ? 'Modifye pwodwi' : 'Nouvo pwodwi'}
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
            <span className={lblCls}>Non pwodwi</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={lblCls}>Slug</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`${inputCls} font-mono text-xs`}
                placeholder="otomatik depi non an"
              />
            </label>
            <label className="block">
              <span className={lblCls}>Non botanik (opsyonèl)</span>
              <input
                value={botanical}
                onChange={(e) => setBotanical(e.target.value)}
                className={`${inputCls} italic`}
                placeholder="Cnidoscolus chayamansa"
              />
            </label>
          </div>

          <label className="block">
            <span className={lblCls}>Slogan / tagline (opsyonèl)</span>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} />
          </label>

          <label className="block">
            <span className={lblCls}>Deskripsyon</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className={lblCls}>Pri</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={lblCls}>Ansyen pri</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                className={inputCls}
                placeholder="opsyonèl"
              />
            </label>
            <label className="block">
              <span className={lblCls}>Deviz</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={lblCls}>Plan rekòmande</span>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>
                <option value="">— Okenn —</option>
                <option value="basic">Bazilik</option>
                <option value="premium">Sitwonèl</option>
                <option value="vip">Melis</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className={lblCls}>Nòt livrezon (opsyonèl)</span>
            <input value={shipping} onChange={(e) => setShipping(e.target.value)} className={inputCls} />
          </label>

          <label className="block">
            <span className={lblCls}>Imaj (URL)</span>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`${inputCls} font-mono text-xs`}
              placeholder="https://…"
            />
          </label>
          {imageUrl && (
            <div className="w-24 h-24 rounded-xl bg-cream-100 overflow-hidden border border-cream-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-cream-300 text-forest-600 focus:ring-forest-200"
              />
              <span className="text-sm font-semibold text-ink">Aktif (vizib)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-cream-300 text-gold-600 focus:ring-gold-200"
              />
              <span className="text-sm font-semibold text-ink">Vedèt</span>
            </label>
          </div>

          {err && <p className="text-xs text-rose-700">{err}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {product ? (
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
