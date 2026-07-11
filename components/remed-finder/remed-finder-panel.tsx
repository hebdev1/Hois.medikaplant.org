'use client';

// "Doktè Maton" assistant panel — a chat-style skin over the keyword search.
// The visitor types how they feel; Doktè Maton "replies" with matching herbal
// products (each linking to the shop). There is NO runtime LLM — matching is
// the same client-side Fuse.js dictionary; the assistant framing + the short
// "analyzing" beat are presentational. Copy stays suggestion-only (never
// diagnostic) and the FDA disclaimer is pinned, non-dismissable.
// Mobile: bottom sheet. Desktop (sm+): 400px panel anchored bottom-right.

import React from 'react';
import { Search, X, Loader2, Sparkles, Stethoscope } from 'lucide-react';
import { useRemedSearch, normalizeQuery } from './use-remed-search';
import ConditionChips from './condition-chips';
import ProductCard from './product-card';

const DISCLAIMER =
  'Pwodui sa yo pa fèt pou dyagnostike, trete, geri, oswa anpeche okenn maladi. ' +
  'Deklarasyon sa yo pa evalye pa FDA. Toujou konsilte yon pwofesyonèl sante anvan ' +
  'ou itilize remèd fèy, sitou si w ap pran medikaman. Kite yon espas 2 èdtan ant ' +
  'pwodui fèy yo ak medikaman preskri yo.';

/** Doktè Maton avatar — a dark-green doctor icon on a pale-green bubble
 *  (high contrast) with a small gold AI spark. */
function DrAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]';
  return (
    <span
      className={`relative grid place-items-center ${dim} rounded-full bg-forest-100 text-forest-700 border border-forest-200 shrink-0`}
      aria-hidden
    >
      <Stethoscope className={icon} strokeWidth={2.2} />
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold-400 border-2 border-white grid place-items-center">
        <Sparkles className="w-1.5 h-1.5 text-forest-900" strokeWidth={3} />
      </span>
    </span>
  );
}

/** A left-aligned assistant speech bubble. */
function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <DrAvatar size="sm" />
      <div className="rounded-2xl rounded-tl-sm bg-forest-50 border border-forest-100 px-3 py-2 text-[13px] leading-snug text-ink">
        {children}
      </div>
    </div>
  );
}

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
  const norm = normalizeQuery(query);

  // "Doktè Maton ap analize…" — a short presentational beat so the reply
  // feels considered (matching itself is instant). Debounced on the query.
  const [thinking, setThinking] = React.useState(false);
  React.useEffect(() => {
    if (norm.length < 2) {
      setThinking(false);
      return;
    }
    setThinking(true);
    const t = setTimeout(() => setThinking(false), 550);
    return () => clearTimeout(t);
  }, [norm]);

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

  const hasQuery = norm.length >= 2;
  const showResults = ready && hasQuery && !thinking && results.length > 0;
  const showEmptyState =
    ready && hasQuery && !thinking && results.length === 0;
  const showIntro = ready && !hasQuery;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Doktè Maton — asistan remèd natirèl"
      translate="no"
      className="notranslate fixed inset-0 z-[120] flex items-end sm:items-end sm:justify-end sm:p-6"
    >
      {/* Backdrop — dimmed on mobile; subtle on desktop so the assistant
          feels like a helper, not a modal takeover. */}
      <button
        type="button"
        aria-label="Fèmen"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 sm:bg-transparent"
      />

      <div className="relative w-full sm:w-[400px] bg-white border border-cream-200 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[72vh] animate-fadeUp">
        {/* Header — assistant identity */}
        <header className="px-4 pt-4 pb-3 border-b border-cream-100 flex items-center justify-between gap-3 bg-gradient-to-b from-forest-50/60 to-transparent rounded-t-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <DrAvatar />
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-ink leading-tight flex items-center gap-1.5">
                Doktè Maton
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gold-100 text-[8px] font-bold uppercase tracking-wider text-gold-700">
                  <Sparkles className="w-2 h-2" strokeWidth={2.6} /> AI
                </span>
              </h2>
              <p className="text-[11px] text-earth-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 inline-block" />
                Asistan remèd natirèl · an liy
              </p>
            </div>
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

        {/* Scrollable conversation body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[140px]">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-earth-600">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
              Ap prepare Doktè Maton…
            </div>
          )}

          {loadError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
              Doktè Maton pa rive konekte ({loadError}). Tcheke koneksyon w
              epi eseye ankò.
            </div>
          )}

          {/* Greeting + chips when the visitor hasn't asked anything yet */}
          {showIntro && (
            <>
              <Bubble>
                Bonjou 👋 Mwen se <b>Doktè Maton</b>. Di m ki jan w santi w —
                yon sentòm oswa yon kondisyon — epi m ap sijere w kèk{' '}
                <b>remèd fèy natirèl</b> ki ka ede w.
              </Bubble>
              <div className="pl-9">
                <ConditionChips
                  conditions={featured}
                  onSelect={selectCondition}
                />
              </div>
            </>
          )}

          {/* Analyzing beat */}
          {ready && hasQuery && thinking && (
            <div className="flex items-center gap-2">
              <DrAvatar size="sm" />
              <div className="rounded-2xl rounded-tl-sm bg-forest-50 border border-forest-100 px-3 py-2.5">
                <span className="flex gap-1" aria-label="Doktè Maton ap analize">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce" />
                </span>
              </div>
            </div>
          )}

          {/* Doktè Maton's reply with matched products */}
          {showResults && (
            <>
              <Bubble>
                Dapre sa w di m, men kèk remèd fèy ou ka konsidere 🌿 Chak
                lyen mennen w sou boutik la.
              </Bubble>
              <div className="pl-9 space-y-4">
                {results.map(({ condition, products }) => (
                  <section key={condition.slug}>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-forest-800 mb-2 flex items-center gap-1.5">
                      {condition.emoji && (
                        <span aria-hidden>{condition.emoji}</span>
                      )}
                      {condition.name_ht}
                    </h3>
                    <div className="space-y-2">
                      {products.map((p) => (
                        <ProductCard key={p.wc_id} product={p} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}

          {showEmptyState && (
            <Bubble>
              M pa jwenn anyen pou sa 🌿 Eseye yon lòt mo (egzanp:{' '}
              <i>tansyon</i>, <i>pa ka dòmi</i>), oswa chwazi youn nan
              kategori anwo yo.
            </Bubble>
          )}
        </div>

        {/* Composer — the visitor "talks" to Doktè Maton */}
        <div className="px-4 pt-2 pb-2 border-t border-cream-100">
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
              placeholder="Di Doktè Maton sa k ap deranje w…"
              aria-label="Ekri yon sentòm oswa kondisyon pou Doktè Maton"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-cream-50 border border-cream-200 text-sm text-ink placeholder:text-earth-500 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 transition"
            />
          </div>
        </div>

        {/* FDA disclaimer — pinned, always visible, non-dismissable. */}
        <footer className="px-4 py-2.5 border-t border-cream-200 bg-cream-50 rounded-b-none sm:rounded-b-2xl">
          <p className="text-[9.5px] leading-snug text-earth-600">
            {DISCLAIMER}
          </p>
        </footer>
      </div>
    </div>
  );
}
