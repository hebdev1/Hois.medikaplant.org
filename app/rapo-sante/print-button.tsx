'use client';

import { Printer } from 'lucide-react';

// Opens the browser print dialog (→ "Save as PDF"). Hidden on the printout.
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-md"
    >
      <Printer className="w-4 h-4" strokeWidth={2.2} />
      Enprime / Sove kòm PDF
    </button>
  );
}
