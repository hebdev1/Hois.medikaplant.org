'use client';

// The Remèd Finder panel — search input, featured chips, grouped results,
// and the non-dismissable FDA disclaimer pinned to the bottom.
// Mobile: bottom sheet. Desktop (sm+): 400px panel anchored bottom-right.

import React from 'react';
import { Search, X, Loader2, Leaf } from 'lucide-react';
import { useRemedSearch, normalizeQuery } from './use-remed-search';
import ConditionChips from './condition-chips';
import ProductCard from './product-card';

const DISCLAIMER =
  'Pwodui sa yo pa fèt pou dyagnostike, trete, geri, oswa anpeche okenn maladi. ' +
  'Deklarasyon sa yo pa evalye pa FDA. Toujou konsilte yon pwofesyonèl sante anvan ' +
  'ou itilize remèd fèy, sitou si w ap pran medikaman. Kite yon espas 2 èdtan ant ' +
  'pwodui fèy yo ak medikaman preskri yo.';

export default function RemedFinderPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const {
    loading,
    loadError,
    ready,
    query,
    setQuery,
    results,
    featured,
    selectCondition,
  } = useRemedSearch(true);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Autofocus the search input once data is ready.
  React.useEffect(() => {
    if (ready) inputRef.current?.focus();
  }, [ready]);

  // Escape closes.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const norm = normalizeQuery(query);
  const showEmptyState = ready && norm.length >= 2 && results.length === 0;
  const showChips = ready && (norm.length < 2 || showEmptyState);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chèche yon remèd"
      translate="no"
      className="notranslate fixed inset-0 z-[120] flex items-end sm:items-end sm:justify-end sm:p-6"
    >
      {/* Backdrop — mobile gets a dimmed backdrop; desktop stays subtle
          so the panel feels like a helper, not a modal takeover. */}
      <button
        type="button"
        aria-label="Fèmen"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 sm:bg-transparent"
      />

      <div className="relative w-full sm:w-[400px] bg-white border border-cream-200 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[70vh] animate-fadeUp">
        {/* Header */}
        <header className="px-4 pt-4 pb-3 border-b border-cream-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-forest-700 text-cream-50">
                <Leaf className="w-3.5 h-3.5" strokeWidth={2.4} />
              </span>
              Ki sa k ap deranje w?
            </h2>
            <p className="text-[11px] text-earth-600 mt-1">
              Ekri yon sentòm oswa yon kondisyon — n ap montre w remèd fèy ki
              ka ede w.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fèmen"
            className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700 shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </header>

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
              strokeWidth={2.2}
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Egz: tansyon, pa ka dòmi, vant balonnen…"
              aria-label="Chèche yon sentòm oswa kondisyon"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-sm text-ink placeholder:text-earth-500 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 transition"
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-4 min-h-[120px]">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-earth-600">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
              Ap chaje remèd yo…
            </div>
          )}

          {loadError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
              Nou pa rive chaje done yo ({loadError}). Tcheke koneksyon w
              epi eseye ankò.
            </div>
          )}

          {showEmptyState && (
            <p className="text-sm text-earth-600 py-2">
              Nou pa jwenn anyen pou sa 🌿 — eseye yon lòt mo, oswa gade
              kategori yo.
            </p>
          )}

          {results.map(({ condition, products }) => (
            <section key={condition.slug}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-forest-800 mb-2 flex items-center gap-1.5">
                {condition.emoji && <span aria-hidden>{condition.emoji}</span>}
                {condition.name_ht}
              </h3>
              <div className="space-y-2">
                {products.map((p) => (
                  <ProductCard key={p.wc_id} product={p} />
                ))}
              </div>
            </section>
          ))}

          {showChips && (
            <ConditionChips conditions={featured} onSelect={selectCondition} />
          )}
        </div>

        {/* FDA disclaimer — fixed at panel bottom, always visible,
            non-dismissable (compliance requirement). */}
        <footer className="px-4 py-2.5 border-t border-cream-200 bg-cream-50 rounded-b-none sm:rounded-b-2xl">
          <p className="text-[9.5px] leading-snug text-earth-600">
            {DISCLAIMER}
          </p>
        </footer>
      </div>
    </div>
  );
}
