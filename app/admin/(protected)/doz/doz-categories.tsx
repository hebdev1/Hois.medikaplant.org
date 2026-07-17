'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Save, X, Tag } from 'lucide-react';
import { saveDozCategory, deleteDozCategory } from './actions';

export type DozCategory = { id: string; label: string; display_order: number };

const input =
  'px-3 py-1.5 rounded-lg bg-white border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-200';

export default function DozCategories({ categories }: { categories: DozCategory[] }) {
  const router = useRouter();
  const [label, setLabel] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (label.trim().length < 2) return;
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.set('label', label);
    const res = await saveDozCategory(null, {}, fd);
    setBusy(false);
    if (res.error) setErr(res.error);
    else { setLabel(''); router.refresh(); }
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        Kategori Resèt yo
      </h2>

      <form onSubmit={add} className="flex gap-2 mb-3">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Non kategori (egz: Detòks)" className={`${input} flex-1`} />
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-xs font-semibold disabled:opacity-60">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />}
          Ajoute
        </button>
      </form>
      {err && <p className="text-xs text-rose-700 mb-2">{err}</p>}

      {categories.length === 0 ? (
        <p className="text-sm text-earth-500 italic">Pa gen kategori pou kounye a.</p>
      ) : (
        <ul className="space-y-1.5">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} onChanged={() => router.refresh()} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryRow({ category, onChanged }: { category: DozCategory; onChanged: () => void }) {
  const [editing, setEditing] = React.useState(false);
  const [label, setLabel] = React.useState(category.label);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    const fd = new FormData();
    fd.set('label', label);
    fd.set('display_order', String(category.display_order));
    await saveDozCategory(category.id, {}, fd);
    setBusy(false);
    setEditing(false);
    onChanged();
  }
  async function del() {
    setBusy(true);
    await deleteDozCategory(category.id);
    setBusy(false);
    onChanged();
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={`${input} flex-1`} />
        <button type="button" onClick={save} disabled={busy} className="p-1.5 rounded-lg bg-forest-700 text-cream-50"><Save className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => setEditing(false)} className="p-1.5 rounded-lg border border-cream-200"><X className="w-3.5 h-3.5" /></button>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 rounded-lg bg-cream-50/50 border border-cream-200 px-3 py-1.5">
      <span className="flex-1 text-sm text-ink">{category.label}</span>
      <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-forest-700">Modifye</button>
      <button type="button" onClick={del} disabled={busy} className="text-earth-400 hover:text-rose-600">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />}
      </button>
    </li>
  );
}
