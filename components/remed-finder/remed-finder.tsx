'use client';

// "Doktè Maton" — the floating natural-remedy assistant. The button lives in
// the initial bundle (tiny); the panel + Fuse.js + Supabase fetch only load
// when the visitor opens it (next/dynamic + dynamic import inside the hook).
// Mounted from the root layout so it's available on every page.
//
// Note: there is NO runtime LLM. Matching stays keyword-based (see
// use-remed-search). "Doktè Maton" is a friendly assistant *persona* layered
// over that dictionary — the copy stays suggestion-only (never diagnostic)
// and the FDA disclaimer stays pinned in the panel.

import React from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Stethoscope } from 'lucide-react';

const RemedFinderPanel = dynamic(() => import('./remed-finder-panel'), {
  ssr: false,
});

const SEEN_KEY = 'remed-finder-seen';

export default function RemedFinder() {
  const [open, setOpen] = React.useState(false);
  const [pulse, setPulse] = React.useState(false);

  // Subtle pulse on first visit of the session, until first open.
  React.useEffect(() => {
    try {
      if (!sessionStorage.getItem(SEEN_KEY)) setPulse(true);
    } catch {
      /* private mode — skip the pulse */
    }
  }, []);

  function onOpen() {
    setOpen(true);
    setPulse(false);
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* best-effort */
    }
  }

  return (
    <>
      {/* Stacked ABOVE the TranslateSwitcher. Reads as a personal AI
          assistant: avatar bubble + name + a small "AI" sparkle. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Louvri Doktè Maton, asistan remèd natirèl"
        translate="no"
        className="notranslate group fixed bottom-16 right-4 sm:bottom-20 sm:right-6 z-[95] inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-gradient-to-br from-forest-600 to-forest-800 text-cream-50 shadow-lg border border-forest-500/60 transition hover:brightness-110"
      >
        {pulse && (
          <span
            className="absolute inset-0 rounded-full bg-gold-400/30 animate-pulseGold pointer-events-none"
            aria-hidden
          />
        )}
        {/* Assistant avatar — dark-green doctor icon on a pale-green bubble */}
        <span className="relative grid place-items-center w-8 h-8 rounded-full bg-forest-100 text-forest-700 border border-forest-200 shadow-inner">
          <Stethoscope className="w-4 h-4" strokeWidth={2.2} aria-hidden />
          {/* live "AI online" dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold-400 border-2 border-forest-800 grid place-items-center">
            <Sparkles className="w-1.5 h-1.5 text-forest-900" strokeWidth={3} />
          </span>
        </span>
        <span className="flex flex-col items-start leading-none">
          <span className="text-[13px] font-bold tracking-tight">
            Doktè Maton
          </span>
          <span className="text-[9px] uppercase tracking-[0.14em] text-cream-200/85">
            Asistan remèd
          </span>
        </span>
      </button>

      {open && <RemedFinderPanel onClose={() => setOpen(false)} />}
    </>
  );
}
