'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, Loader2, X, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/cvui-badge';
import { saveLakouTab, deleteLakouTab, type LakouTab } from './actions';

export default function LakouAdmin({ tabs }: { tabs: LakouTab[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<LakouTab | null | 'new'>(null);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[900px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
            Kontni · Lakou Limyè
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Tab Lakou Limyè
          </h1>
          <p className="mt-1.5 text-sm text-earth-600 max-w-2xl">
            Kreye ak òganize tab yo (egz. Salon Mistik, Emisyon Spirityèl, Pakou Limyè).
            Answit, asiyen videyo/odyo/atik yo nan yon tab lè w edite yo nan seksyon pa
            yo. Manm yo wè tab sa yo nan{' '}
            <span className="font-mono text-earth-700">/dashboard/lakou-limye</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Nouvo tab
        </button>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {tabs.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">
            Poko gen tab. Kreye premye tab la.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {tabs.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5">
                <span className="font-mono text-[11px] text-earth-400 w-6 text-center shrink-0">
                  {t.display_order}
                </span>
                <GripVertical className="w-4 h-4 text-earth-300 shrink-0" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">{t.name}</span>
                    {!t.active && (
                      <Badge label="Kache" variant="secondary" appearance="subtle" size="small" />
                    )}
                  </div>
                  <div className="text-[11px] text-earth-500 font-mono truncate">{t.slug}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition shrink-0"
                >
                  Modifye
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <TabModal
          tab={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TabModal({
  tab,
  onClose,
  onChanged,
}: {
  tab: LakouTab | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = React.useState(tab?.name ?? '');
  const [order, setOrder] = React.useState(String(tab?.display_order ?? 0));
  const [active, setActive] = React.useState(tab?.active ?? true);
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await saveLakouTab({
      id: tab?.id,
      name,
      display_order: Number(order) || 0,
      active,
    });
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  async function remove() {
    if (!tab?.id) return;
    setBusy(true);
    const res = await deleteLakouTab(tab.id);
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';
  const lbl = 'text-[11px] font-bold uppercase tracking-wider text-earth-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fèmen" onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100">
          <h2 className="font-display text-lg font-bold text-ink">
            {tab ? 'Modifye tab' : 'Nouvo tab'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fèmen" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700">
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <span className={lbl}>Non tab la</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Salon Mistik" />
          </label>
          <label className="block">
            <span className={lbl}>Lòd afichaj</span>
            <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className={inputCls} />
          </label>
          <label className="flex items-center gap-2.5 py-1 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded border-cream-300 text-forest-600 focus:ring-forest-200" />
            <span className="text-sm font-semibold text-ink">Aktif (vizib pou manm yo)</span>
          </label>

          {err && <p className="text-xs text-rose-700">{err}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {tab ? (
              !confirmDel ? (
                <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-sm font-semibold transition">
                  <Trash2 className="w-4 h-4" strokeWidth={2.2} /> Efase
                </button>
              ) : (
                <span className="flex items-center gap-1.5">
                  <button type="button" onClick={remove} disabled={busy} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-60">Konfime</button>
                  <button type="button" onClick={() => setConfirmDel(false)} className="px-2 text-sm text-earth-500">Anile</button>
                </span>
              )
            ) : (
              <span />
            )}
            <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Anrejistre
            </button>
          </div>
          {tab && (
            <p className="text-[11px] text-earth-500">
              Efase yon tab pa efase kontni an — li jis retire asiyasyon an.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
