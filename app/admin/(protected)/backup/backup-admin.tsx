'use client';

import React from 'react';
import { Database, Download, Upload, Loader2, Check, AlertTriangle } from 'lucide-react';
import { exportCms, importCms, type ImportResult } from './actions';

export default function BackupAdmin({
  counts,
}: {
  counts: { label: string; count: number }[];
}) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function exportJson() {
    setBusy(true);
    setErr(null);
    setDone(false);
    const res = await exportCms();
    setBusy(false);
    if (!res.ok || !res.json) {
      setErr(res.error ?? 'Echwe.');
      return;
    }
    try {
      const blob = new Blob([res.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hois-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const total = counts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[800px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Database className="w-3.5 h-3.5" strokeWidth={2.2} />
          Sistèm · Backup
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Backup &amp; Ekspòtasyon
        </h1>
        <p className="mt-1.5 text-sm text-earth-600">
          Telechaje yon kopi tout kontni CMS la (paj, atik, videyo, redireksyon, modèl,
          medya) nan yon sèl fichye JSON — epi remete l nenpòt lè.
        </p>
      </header>

      {/* Export */}
      <div className="bg-white border border-cream-200 rounded-2xl shadow-card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {counts.map((c) => (
            <div key={c.label} className="rounded-xl border border-cream-200 bg-cream-50/50 p-3">
              <div className="font-display text-2xl font-bold text-ink">{c.count}</div>
              <div className="text-[11px] uppercase tracking-wide text-earth-500 font-bold">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={exportJson}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : done ? (
            <Check className="w-4 h-4" strokeWidth={2.6} />
          ) : (
            <Download className="w-4 h-4" strokeWidth={2.4} />
          )}
          {busy ? 'Ap prepare…' : done ? 'Telechaje!' : `Ekspòte tout (${total}) — JSON`}
        </button>
        {err && <p className="mt-3 text-sm text-rose-700">{err}</p>}

        <p className="mt-4 text-xs text-earth-500">
          Backup otomatik Supabase la kouvri tout bazdone a deja; sa a se yon kopi kontni
          CMS la sèlman, fasil pou pote ale.
        </p>
      </div>

      {/* Import / restore */}
      <ImportCard />
    </div>
  );
}

function ImportCard() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = React.useState<{ name: string; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onFile(file: File) {
    setErr(null);
    setResult(null);
    try {
      const text = await file.text();
      setPending({ name: file.name, text });
    } catch (e) {
      setErr((e as Error).message);
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  async function doImport() {
    if (!pending) return;
    setBusy(true);
    setErr(null);
    const res = await importCms(pending.text);
    setBusy(false);
    setPending(null);
    if (!res.ok) {
      setErr(res.error ?? 'Echwe.');
      return;
    }
    setResult(res);
  }

  return (
    <div className="mt-5 bg-white border border-cream-200 rounded-2xl shadow-card p-6">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
        <Upload className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        Enpòte / remete yon backup
      </h2>
      <p className="mt-1 text-sm text-earth-600">
        Chwazi yon fichye backup JSON. Kontni ki egziste ap mete ajou, sa ki nouvo ap
        ajoute — <span className="font-semibold">anyen p ap efase</span>.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {!pending ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cream-300 bg-white text-ink text-sm font-bold hover:border-forest-300 disabled:opacity-60 transition"
        >
          <Upload className="w-4 h-4" strokeWidth={2.4} />
          Chwazi yon fichye backup
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
            <div className="text-sm">
              Pare pou enpòte <span className="font-mono font-semibold">{pending.name}</span>.
              Sa ap mete ajou kontni CMS ki gen menm ID yo. Ou vle kontinye?
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={doImport}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold hover:bg-forest-800 disabled:opacity-60 transition"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Wi, enpòte
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              disabled={busy}
              className="px-3 py-2 text-sm font-semibold text-earth-600 hover:text-ink"
            >
              Anile
            </button>
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-sm text-rose-700">{err}</p>}

      {result?.results && (
        <div className="mt-4">
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800 mb-2">
            <Check className="w-4 h-4" strokeWidth={2.6} /> Enpòtasyon fini
          </div>
          <ul className="divide-y divide-cream-100 rounded-xl border border-cream-200 overflow-hidden">
            {Object.entries(result.results).map(([table, r]) => (
              <li key={table} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-xs text-earth-600">{table}</span>
                {r.error ? (
                  <span className="text-rose-700 text-xs">{r.error}</span>
                ) : (
                  <span className="font-semibold text-ink">{r.imported} liy</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
