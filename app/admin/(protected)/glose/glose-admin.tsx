'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Leaf,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createGlossTerm, updateGlossTerm, deleteGlossTerm, type TermInput } from './actions';

export type AdminTerm = {
  id: string;
  code: string | null;
  letter: string;
  name: string;
  variants: string[];
  family: string | null;
  scientific_name: string | null;
  tramil: string;
  status: string;
  note: string | null;
  active: boolean;
  display_order: number;
};

const STATUS_TONE: Record<string, string> = {
  verifye: 'bg-forest-100 text-forest-700',
  pwovizwa: 'bg-amber-100 text-amber-800',
  'pwoblèm': 'bg-orange-100 text-orange-700',
};
const STATUS_LABEL: Record<string, string> = {
  verifye: 'Verifye',
  pwovizwa: 'Pwovizwa',
  'pwoblèm': 'Pou revizyon',
};

type FormState = TermInput;
const BLANK: FormState = {
  code: '', letter: '', name: '', variants: '', family: '',
  scientific_name: '', tramil: 'pa-jwenn', status: 'pwovizwa', note: '',
  active: true, display_order: 0,
};
function fromTerm(t: AdminTerm): FormState {
  return {
    code: t.code ?? '', letter: t.letter, name: t.name,
    variants: t.variants.join(', '), family: t.family ?? '',
    scientific_name: t.scientific_name ?? '', tramil: t.tramil, status: t.status,
    note: t.note ?? '', active: t.active, display_order: t.display_order,
  };
}

export default function GloseAdmin({ initial }: { initial: AdminTerm[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [editing, setEditing] = React.useState<null | 'new' | AdminTerm>(null);
  const [form, setForm] = React.useState<FormState>(BLANK);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = initial.filter((t) =>
    !q ||
    `${t.name} ${t.scientific_name ?? ''} ${t.family ?? ''} ${t.code ?? ''} ${t.variants.join(' ')}`
      .toLowerCase()
      .includes(q)
  );
  const groups = filtered.reduce<Record<string, AdminTerm[]>>((acc, t) => {
    (acc[t.letter] ??= []).push(t);
    return acc;
  }, {});
  const letters = Object.keys(groups).sort();

  function openNew() {
    setForm(BLANK);
    setEditing('new');
    setError(null);
  }
  function openEdit(t: AdminTerm) {
    setForm(fromTerm(t));
    setEditing(t);
    setError(null);
  }
  function close() {
    setEditing(null);
    setError(null);
  }
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res =
      editing === 'new'
        ? await createGlossTerm(form)
        : await updateGlossTerm((editing as AdminTerm).id, form);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(t: AdminTerm) {
    if (!window.confirm(`Efase « ${t.name} » nèt? Sa pa ka defèt.`)) return;
    setBusyId(t.id);
    const res = await deleteGlossTerm(t.id);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const inputCls =
    'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300';

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Leaf className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Glosè plant
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Glosè Plant Ayisyen
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Kreye, modifye, oswa efase antre yo. Chanjman yo parèt imedyatman sou
            paj piblik la.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/glose"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-earth-700 hover:text-ink border border-cream-200 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.2} />
            Wè paj piblik la
          </Link>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            Nouvo antre
          </button>
        </div>
      </header>

      {error && !editing && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          {error}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <form
          onSubmit={save}
          className="mb-6 bg-white border border-forest-200 rounded-2xl p-5 md:p-6 shadow-card space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">
              {editing === 'new' ? 'Nouvo antre' : `Modifye « ${(editing as AdminTerm).name} »`}
            </h2>
            <button type="button" onClick={close} className="text-earth-500 hover:text-ink">
              <X className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </div>

          <div className="grid sm:grid-cols-[1fr_90px_110px] gap-3">
            <Field label="Non kreyòl" required>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputCls} placeholder="Abriko" />
            </Field>
            <Field label="Lèt">
              <input value={form.letter} onChange={(e) => set('letter', e.target.value)} maxLength={1} className={cn(inputCls, 'uppercase text-center')} placeholder="A" />
            </Field>
            <Field label="Kòd GLOS">
              <input value={form.code} onChange={(e) => set('code', e.target.value)} className={cn(inputCls, 'font-mono text-xs')} placeholder="GLOS-0022" />
            </Field>
          </div>

          <Field label="Non syantifik">
            <input value={form.scientific_name} onChange={(e) => set('scientific_name', e.target.value)} className={cn(inputCls, 'italic')} placeholder="Mammea americana L." />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Fanmi botanik">
              <input value={form.family} onChange={(e) => set('family', e.target.value)} className={inputCls} placeholder="Clusiaceae" />
            </Field>
            <Field label="Lòt non (separe ak vigil)">
              <input value={form.variants} onChange={(e) => set('variants', e.target.value)} className={inputCls} placeholder="abriko peyi, zabriko" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-[1fr_1fr_120px] gap-3">
            <Field label="Estati editoryal">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                <option value="verifye">Verifye</option>
                <option value="pwovizwa">Pwovizwa</option>
                <option value="pwoblèm">Pou revizyon</option>
              </select>
            </Field>
            <Field label="TRAMIL">
              <select value={form.tramil} onChange={(e) => set('tramil', e.target.value)} className={inputCls}>
                <option value="konfime">Konfime</option>
                <option value="pa-jwenn">Pa jwenn</option>
              </select>
            </Field>
            <Field label="Lòd">
              <input type="number" min={0} value={form.display_order} onChange={(e) => set('display_order', Number(e.target.value) || 0)} className={inputCls} />
            </Field>
          </div>

          <Field label="Nòt editoryal">
            <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={4} className={cn(inputCls, 'resize-y')} placeholder="Kontradiksyon, ipotèz, oswa desizyon pou pran…" />
          </Field>

          <label className="flex items-center gap-2 text-sm text-earth-700">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-forest-700" />
            Aktif (vizib sou paj piblik la)
          </label>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.2} />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-100">
            <button type="button" onClick={close} className="px-3 py-2 text-sm font-semibold text-earth-700 hover:text-ink">
              Anile
            </button>
            <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />}
              {editing === 'new' ? 'Kreye antre a' : 'Anrejistre'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" strokeWidth={2} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chèche yon antre…"
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200"
        />
      </div>

      <p className="text-xs text-earth-500 mb-3">
        {filtered.length} antre{initial.length !== filtered.length ? ` (sou ${initial.length})` : ''}
      </p>

      {/* List grouped by letter */}
      {letters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-12 text-center text-sm text-earth-600">
          Pa gen antre. Klike « Nouvo antre » pou kòmanse.
        </div>
      ) : (
        <div className="space-y-6">
          {letters.map((L) => (
            <section key={L}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mb-2 px-1">
                Lèt {L}
              </div>
              <div className="bg-white border border-cream-200 rounded-2xl shadow-card divide-y divide-cream-100 overflow-hidden">
                {groups[L].map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-cream-50/60">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink truncate">{t.name}</span>
                        {t.code && <span className="text-[10px] font-mono text-earth-400">{t.code}</span>}
                        {!t.active && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cream-200 text-earth-700">
                            <EyeOff className="w-3 h-3" strokeWidth={2.2} />
                            Kache
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-earth-500 italic truncate">
                        {t.scientific_name || 'non syantifik poko dokimante'}
                        {t.family ? ` · ${t.family}` : ''}
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0', STATUS_TONE[t.status])}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-earth-600 hover:text-forest-700 hover:bg-forest-50 transition" aria-label="Modifye">
                      <Pencil className="w-4 h-4" strokeWidth={2.2} />
                    </button>
                    <button onClick={() => remove(t)} disabled={busyId === t.id} className="p-2 rounded-lg text-earth-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition" aria-label="Efase">
                      {busyId === t.id ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} /> : <Trash2 className="w-4 h-4" strokeWidth={2.2} />}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
