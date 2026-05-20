'use client';

import React from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import { getHealthCsv } from '@/app/dashboard/health/actions';

export default function ExportCsvButton() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onExport() {
    setPending(true);
    setError(null);
    const res = await getHealthCsv();
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onExport}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Download className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        Esporte CSV
      </button>
      <a
        href="mailto:?subject=Done%20sante%20m%20yo%20-%20MedikaPlant&body=Bonjou%20Doktè%2C%0A%0AMwen%20vle%20pataje%20done%20sante%20m%20yo%20avè%20w.%20Tanpri%20wè%20pyès%20jwenn%20la%20a.%0A%0AMèsi%2C%0A"
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white text-earth-700 border border-cream-200 hover:border-forest-300 hover:text-forest-700 rounded-lg transition"
      >
        <Share2 className="w-3.5 h-3.5" strokeWidth={2.2} />
        Pataje ak doktè
      </a>
      {error && (
        <div className="col-span-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1.5 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
