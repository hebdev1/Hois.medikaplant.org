'use client';

import { ArrowRight } from 'lucide-react';

// The "Remèd Finder" row in the Laboratwa entry list. Clicking it opens the
// existing floating Doktè Maton assistant (mounted globally) via a window event.
export default function OpenRemedButton() {
  return (
    <button
      type="button"
      className="lab-srow"
      onClick={() => window.dispatchEvent(new Event('open-remed-finder'))}
      style={{
        font: 'inherit',
        color: 'inherit',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--liy)',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span>Remèd Finder — mande Doktè Maton</span>
      <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
    </button>
  );
}
