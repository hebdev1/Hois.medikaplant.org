'use client';

// Remèd Finder mount point — the floating button lives in the initial
// bundle (tiny); the panel + Fuse.js + Supabase fetch only load when the
// visitor actually opens it (next/dynamic + dynamic import inside the
// hook). Mounted from the root layout so it's available on every page.

import React from 'react';
import dynamic from 'next/dynamic';
import { Leaf } from 'lucide-react';

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
      {/* Stacked ABOVE the TranslateSwitcher (bottom-4/6 right-4/6,
          z-100). Forest green to read as "plant remedies", distinct
          from the gold suggestion button on the dashboard (which sits
          one slot higher there). */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Chèche yon remèd"
        translate="no"
        className="notranslate fixed bottom-16 right-4 sm:bottom-20 sm:right-6 z-[95] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-cream-50 shadow-lg border border-forest-600 transition"
      >
        {pulse && (
          <span
            className="absolute inset-0 rounded-full bg-gold-400/30 animate-pulseGold pointer-events-none"
            aria-hidden
          />
        )}
        <Leaf className="w-4 h-4" strokeWidth={2.2} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Remèd
        </span>
      </button>

      {open && <RemedFinderPanel onClose={() => setOpen(false)} />}
    </>
  );
}
