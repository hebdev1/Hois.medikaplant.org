'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Plus, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { createRedirect, toggleRedirect, deleteRedirect } from './actions';

type Row = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  active: boolean;
  hits: number;
  created_at: string;
};

export default function RedirectsAdmin({ redirects }: { redirects: Row[] }) {
  const router = useRouter();
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [code, setCode] = React.useState(301);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [rowBusy, setRowBusy] = React.useState<string | null>(null);

  async function add() {
    setBusy(true);
    setErr(null);
    const res = await createRedirect({ from_path: from, to_path: to, status_code: code });
    setBusy(false);
    if (res.ok) {
      setFrom('');
      setTo('');
      setCode(301);
      router.refresh();
    } else {
      setErr(res.error ?? 'Echwe.');
    }
  }

  async function toggle(r: Row) {
    setRowBusy(r.id);
    await toggleRedirect(r.id, !r.active);
    setRowBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    setRowBusy(id);
    await deleteRedirect(id);
    setRowBusy(null);
    router.refresh();
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <ArrowRightLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
          SEO · Redireksyon
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Redireksyon
        </h1>
        <p className="mt-1.5 text-sm text-earth-600">
          Voye yon ansyen adrès sou yon nouvo (itil lè yon slug chanje). 301 = pèmanan
          (bon pou SEO).
        </p>
      </header>

      {/* Add form */}
      <div className="bg-white border border-cream-200 rounded-2xl shadow-card p-4 md:p-5 mb-6">
        <div className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-2.5 items-end">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Ansyen adrès</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="/ansyen-paj"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Nouvo adrès</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="/nouvo-paj oswa https://…"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tip</span>
            <select
              value={code}
              onChange={(e) => setCode(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-200"
            >
              <option value={301}>301 pèmanan</option>
              <option value={302}>302 tanporè</option>
              <option value={308}>308 pèmanan</option>
              <option value={307}>307 tanporè</option>
            </select>
          </label>
          <button
            type="button"
            onClick={add}
            disabled={busy || !from.trim() || !to.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition h-[38px]"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.6} />}
            Ajoute
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-rose-700">{err}</p>}
      </div>

      {/* List */}
      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {redirects.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen redireksyon.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {redirects.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 md:px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-mono min-w-0">
                    <span className="text-ink truncate">{r.from_path}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-earth-400 shrink-0" strokeWidth={2.4} />
                    <span className="text-forest-700 truncate">{r.to_path}</span>
                  </div>
                  <div className="text-[10px] text-earth-500 uppercase tracking-wide mt-0.5">
                    {r.status_code} · {r.hits} hit{r.hits === 1 ? '' : 's'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(r)}
                  disabled={rowBusy === r.id}
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full transition disabled:opacity-50 ${
                    r.active
                      ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                      : 'bg-cream-200 text-earth-500 hover:bg-cream-300'
                  }`}
                >
                  {r.active ? 'Aktif' : 'Inaktif'}
                </button>

                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={rowBusy === r.id}
                  aria-label="Efase"
                  className="grid place-items-center w-8 h-8 rounded-lg text-earth-400 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
