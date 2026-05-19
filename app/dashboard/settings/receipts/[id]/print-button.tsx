'use client';

import { Printer } from 'lucide-react';

export default function PrintButtonClient() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
    >
      <Printer className="w-3.5 h-3.5" strokeWidth={2.2} />
      Enprime / Telechaje PDF
    </button>
  );
}
