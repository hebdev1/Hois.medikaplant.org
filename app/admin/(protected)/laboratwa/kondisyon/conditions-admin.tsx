'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Loader2, Check, AlertCircle, Stethoscope, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createCondition, updateCondition, deleteCondition, type ConditionInput, type PlantRec } from './actions';

export type AdminCondition = {
  id: string; slug: string; name_kr: string; intro_kr: string | null; red_flag_kr: string | null;
  doctor_limit_kr: string | null; doctor_attention_kr: string | null; display_order: number;
  status: string; plants: PlantRec[];
};

const BLANK: ConditionInput = {
  slug: '', name_kr: '', intro_kr: '', red_flag_kr: '', doctor_limit_kr: '',
  doctor_attention_kr: '', display_order: 0, status: 'published', plants: [],
};
const toForm = (c: AdminCondition): ConditionInput => ({
  slug: c.slug, name_kr: c.name_kr, intro_kr: c.intro_kr ?? '', red_flag_kr: c.red_flag_kr ?? '',
  doctor_limit_kr: c.doctor_limit_kr ?? '', doctor_attention_kr: c.doctor_attention_kr ?? '',
  display_order: c.display_order, status: c.status, plants: (c.plants ?? []).map((p) => ({ ...p })),
});
const inputCls = 'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200';

export default function ConditionsAdmin({ initial }: { initial: AdminCondition[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminCondition | 'new' | null>(null);
  const [form, setForm] = React.useState<ConditionInput>(BLANK);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [delId, setDelId] = React.useState<string | null>(null);

  function open(c: AdminCondition | 'new') { setEditing(c); setErr(''); setForm(c === 'new' ? { ...BLANK, plants: [] } : toForm(c)); }
  const set = (k: keyof ConditionInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function setPlant(i: number, k: keyof PlantRec, v: string) {
    setForm((f) => ({ ...f, plants: f.plants.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));
  }
  const addPlant = () => setForm((f) => ({ ...f, plants: [...f.plants, { name_kr: '', sci: '', prep: '', tramil: 'REK' }] }));
  const rmPlant = (i: number) => setForm((f) => ({ ...f, plants: f.plants.filter((_, j) => j !== i) }));

  async function save() {
    setBusy(true); setErr('');
    const res = editing === 'new' ? await createCondition(form) : await updateCondition((editing as AdminCondition).id, form);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    setEditing(null); router.refresh();
  }
  async function remove(id: string) { setBusy(true); await deleteCondition(id); setBusy(false); setDelId(null); router.refresh(); }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <Link href="/admin/laboratwa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Laboratwa
      </Link>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Stethoscope className="w-3.5 h-3.5" strokeWidth={2.2} /> Admin · Maladi & Plant
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">Kondisyon yo</h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Modifye kondisyon yo, plant TRAMIL rekòmande, preparasyon dokimante ak drapo wouj.
          </p>
        </div>
        <button onClick={() => open('new')} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg">
          <Plus className="w-4 h-4" strokeWidth={2.4} /> Nouvo kondisyon
        </button>
      </header>

      <div className="grid gap-3">
        {initial.map((c) => (
          <div key={c.id} className="bg-white border border-cream-200 rounded-xl shadow-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg font-bold text-ink">{c.name_kr}</div>
              <div className="text-[12px] text-earth-600">{(c.plants ?? []).length} plant · limit: {c.doctor_limit_kr || '—'}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', c.status === 'published' ? 'bg-forest-100 text-forest-700' : 'bg-cream-100 text-earth-600')}>
                {c.status === 'published' ? 'Pibliye' : 'Bouyon'}
              </span>
              <button onClick={() => open(c)} className="p-2 rounded-lg text-earth-600 hover:text-forest-700 hover:bg-forest-50" aria-label="Modifye"><Pencil className="w-4 h-4" strokeWidth={2} /></button>
              <button onClick={() => setDelId(c.id)} className="p-2 rounded-lg text-earth-600 hover:text-rose-700 hover:bg-rose-50" aria-label="Efase"><Trash2 className="w-4 h-4" strokeWidth={2} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={() => !busy && setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onMouseDown={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
              <h2 className="font-display text-lg font-bold text-ink">{editing === 'new' ? 'Nouvo kondisyon' : form.name_kr}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-cream-100"><X className="w-4 h-4" /></button>
            </header>
            <div className="p-5 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-earth-700">Non kondisyon<input className={inputCls} value={form.name_kr} onChange={set('name_kr')} /></label>
                <label className="text-xs font-semibold text-earth-700">Lòd<input type="number" className={inputCls} value={form.display_order} onChange={set('display_order')} /></label>
              </div>
              <label className="text-xs font-semibold text-earth-700">Entwodiksyon <span className="text-earth-400 font-normal">(opsyonèl)</span><textarea className={cn(inputCls, 'min-h-[60px]')} value={form.intro_kr} onChange={set('intro_kr')} /></label>
              <label className="text-xs font-semibold text-earth-700">Drapo wouj<textarea className={cn(inputCls, 'min-h-[70px]')} value={form.red_flag_kr} onChange={set('red_flag_kr')} placeholder="Kilè pou wè yon doktè…" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-earth-700">Limit anvan doktè<input className={inputCls} value={form.doctor_limit_kr} onChange={set('doctor_limit_kr')} placeholder="2 jou" /></label>
                <label className="text-xs font-semibold text-earth-700">Atansyon patikilye<input className={inputCls} value={form.doctor_attention_kr} onChange={set('doctor_attention_kr')} placeholder="Dezidratasyon = ijans" /></label>
              </div>

              {/* Plants sub-editor */}
              <div className="border border-cream-200 rounded-xl p-3 bg-cream-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-earth-600">Plant rekòmande yo</span>
                  <button onClick={addPlant} className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"><Plus className="w-3.5 h-3.5" strokeWidth={2.4} /> Ajoute</button>
                </div>
                <div className="grid gap-2">
                  {form.plants.length === 0 && <div className="text-xs text-earth-500 italic">Pa gen plant. Klike « Ajoute ».</div>}
                  {form.plants.map((p, i) => (
                    <div key={i} className="border border-cream-200 rounded-lg p-2.5 bg-white grid gap-2">
                      <div className="flex gap-2 items-center">
                        <input className={cn(inputCls, 'py-1.5')} value={p.name_kr} onChange={(e) => setPlant(i, 'name_kr', e.target.value)} placeholder="Non Kreyòl" />
                        <select className={cn(inputCls, 'py-1.5 w-24')} value={p.tramil} onChange={(e) => setPlant(i, 'tramil', e.target.value)}>
                          <option value="REK">REK</option><option value="ENV">ENV</option><option value="TOK">TOK</option>
                        </select>
                        <button onClick={() => rmPlant(i)} className="p-1.5 rounded-lg text-earth-500 hover:text-rose-700 hover:bg-rose-50 shrink-0" aria-label="Retire"><X className="w-4 h-4" /></button>
                      </div>
                      <input className={cn(inputCls, 'py-1.5')} value={p.sci} onChange={(e) => setPlant(i, 'sci', e.target.value)} placeholder="Non syantifik" />
                      <textarea className={cn(inputCls, 'py-1.5 min-h-[48px]')} value={p.prep} onChange={(e) => setPlant(i, 'prep', e.target.value)} placeholder="Preparasyon dokimante…" />
                    </div>
                  ))}
                </div>
              </div>

              <label className="text-xs font-semibold text-earth-700">Estati
                <select className={inputCls} value={form.status} onChange={set('status')}>
                  <option value="draft">Bouyon (pa parèt)</option><option value="published">Pibliye</option>
                </select>
              </label>
              {err && <div className="flex items-center gap-1.5 text-sm text-rose-700"><AlertCircle className="w-4 h-4" /> {err}</div>}
            </div>
            <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-cream-200">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-semibold text-earth-700 hover:bg-cream-100 rounded-lg">Anile</button>
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.4} />} Sove
              </button>
            </footer>
          </div>
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onMouseDown={() => setDelId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm p-5" onMouseDown={(e) => e.stopPropagation()}>
            <div className="font-display text-lg font-bold text-ink mb-1">Efase kondisyon sa a?</div>
            <p className="text-sm text-earth-600 mb-4">Aksyon sa a pa ka defèt.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDelId(null)} className="px-4 py-2 text-sm font-semibold text-earth-700 hover:bg-cream-100 rounded-lg">Anile</button>
              <button onClick={() => remove(delId)} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Efase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
