'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Loader2, Check, AlertCircle, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPlant, updatePlant, deletePlant, type PlantInput } from './actions';

export type AdminPlant = {
  id: string; slug: string; name_kr: string; name_fr: string | null; name_en: string | null;
  name_sci: string; family: string | null; parts_used: string[]; preparations: string[] | null;
  season_months: number[] | null; regions: string[] | null; summary_kr: string | null;
  support_kr: string | null; cautions_kr: string[] | null; status: string;
};

const BLANK: PlantInput = {
  slug: '', name_kr: '', name_fr: '', name_en: '', name_sci: '', family: '',
  parts_used: '', preparations: '', season_months: '', regions: '',
  summary_kr: '', support_kr: '', cautions_kr: '', status: 'draft',
};
const toForm = (p: AdminPlant): PlantInput => ({
  slug: p.slug, name_kr: p.name_kr, name_fr: p.name_fr ?? '', name_en: p.name_en ?? '',
  name_sci: p.name_sci, family: p.family ?? '', parts_used: (p.parts_used ?? []).join(', '),
  preparations: (p.preparations ?? []).join(', '), season_months: (p.season_months ?? []).join(', '),
  regions: (p.regions ?? []).join(', '), summary_kr: p.summary_kr ?? '', support_kr: p.support_kr ?? '',
  cautions_kr: (p.cautions_kr ?? []).join('\n'), status: p.status,
});

const inputCls = 'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200';

export default function PlantsAdmin({ initial }: { initial: AdminPlant[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminPlant | 'new' | null>(null);
  const [form, setForm] = React.useState<PlantInput>(BLANK);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [delId, setDelId] = React.useState<string | null>(null);

  function open(p: AdminPlant | 'new') {
    setEditing(p); setErr('');
    setForm(p === 'new' ? BLANK : toForm(p));
  }
  const set = (k: keyof PlantInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true); setErr('');
    const res = editing === 'new' ? await createPlant(form) : await updatePlant((editing as AdminPlant).id, form);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    setEditing(null); router.refresh();
  }
  async function remove(id: string) {
    setBusy(true);
    await deletePlant(id);
    setBusy(false); setDelId(null); router.refresh();
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Leaf className="w-3.5 h-3.5" strokeWidth={2.2} /> Admin · Plant Laboratwa
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">Plant yo</h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Modifye tout enfòmasyon. « Sipò » ak « prekosyon » ki vid bezwen ranpli ak
            sous TRAMIL ou a. Estati « bouyon » pa parèt sou paj piblik la.
          </p>
        </div>
        <button onClick={() => open('new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition">
          <Plus className="w-4 h-4" strokeWidth={2.4} /> Nouvo plant
        </button>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
            <tr>
              <th className="text-left px-5 py-3">Plant</th>
              <th className="text-left px-3 py-3">Sipò / Prekosyon</th>
              <th className="text-left px-3 py-3">Estati</th>
              <th className="text-right px-5 py-3">Aksyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {initial.map((p) => (
              <tr key={p.id} className="hover:bg-cream-50/60">
                <td className="px-5 py-3">
                  <div className="font-semibold text-ink">{p.name_kr}</div>
                  <div className="text-[11px] text-earth-500 italic">{p.name_sci}</div>
                </td>
                <td className="px-3 py-3 text-[11px]">
                  <span className={cn('inline-block px-1.5 py-0.5 rounded mr-1', p.support_kr ? 'bg-forest-100 text-forest-700' : 'bg-amber-100 text-amber-800')}>
                    {p.support_kr ? 'sipò ✓' : 'sipò vid'}
                  </span>
                  <span className={cn('inline-block px-1.5 py-0.5 rounded', (p.cautions_kr ?? []).length ? 'bg-forest-100 text-forest-700' : 'bg-amber-100 text-amber-800')}>
                    {(p.cautions_kr ?? []).length ? 'prekosyon ✓' : 'prekosyon vid'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', p.status === 'published' ? 'bg-forest-100 text-forest-700' : 'bg-cream-100 text-earth-600')}>
                    {p.status === 'published' ? 'Pibliye' : 'Bouyon'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => open(p)} className="p-2 rounded-lg text-earth-600 hover:text-forest-700 hover:bg-forest-50" aria-label="Modifye">
                    <Pencil className="w-4 h-4" strokeWidth={2} />
                  </button>
                  <button onClick={() => setDelId(p.id)} className="p-2 rounded-lg text-earth-600 hover:text-rose-700 hover:bg-rose-50" aria-label="Efase">
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={() => !busy && setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onMouseDown={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
              <h2 className="font-display text-lg font-bold text-ink">{editing === 'new' ? 'Nouvo plant' : form.name_kr}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-cream-100"><X className="w-4 h-4" /></button>
            </header>
            <div className="p-5 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-earth-700">Non Kreyòl<input className={inputCls} value={form.name_kr} onChange={set('name_kr')} /></label>
                <label className="text-xs font-semibold text-earth-700">Non syantifik<input className={inputCls} value={form.name_sci} onChange={set('name_sci')} /></label>
                <label className="text-xs font-semibold text-earth-700">Non Franse<input className={inputCls} value={form.name_fr} onChange={set('name_fr')} /></label>
                <label className="text-xs font-semibold text-earth-700">Non Anglè<input className={inputCls} value={form.name_en} onChange={set('name_en')} /></label>
                <label className="text-xs font-semibold text-earth-700">Fanmi<input className={inputCls} value={form.family} onChange={set('family')} /></label>
                <label className="text-xs font-semibold text-earth-700">Slug <span className="text-earth-400 font-normal">(otomatik)</span><input className={inputCls} value={form.slug} onChange={set('slug')} placeholder="otomatik depi non" /></label>
              </div>
              <label className="text-xs font-semibold text-earth-700">Pati yo itilize <span className="text-earth-400 font-normal">(vigil: fey, rasin, ekos, fle, grenn, fwi)</span><input className={inputCls} value={form.parts_used} onChange={set('parts_used')} placeholder="fey, fwi" /></label>
              <label className="text-xs font-semibold text-earth-700">Preparasyon <span className="text-earth-400 font-normal">(te, tranpe, bouyi, konpes, benyen, siwo, luil)</span><input className={inputCls} value={form.preparations} onChange={set('preparations')} placeholder="te, bouyi" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-earth-700">Sezon <span className="text-earth-400 font-normal">(mwa 1-12)</span><input className={inputCls} value={form.season_months} onChange={set('season_months')} placeholder="5, 6, 7" /></label>
                <label className="text-xs font-semibold text-earth-700">Rejyon <span className="text-earth-400 font-normal">(kòd: OU, SU…)</span><input className={inputCls} value={form.regions} onChange={set('regions')} placeholder="OU, SU" /></label>
              </div>
              <label className="text-xs font-semibold text-earth-700">Rezime <span className="text-earth-400 font-normal">(yon fraz)</span><input className={inputCls} value={form.summary_kr} onChange={set('summary_kr')} /></label>
              <label className="text-xs font-semibold text-earth-700">Sipò tradisyonèl<textarea className={cn(inputCls, 'min-h-[80px]')} value={form.support_kr} onChange={set('support_kr')} placeholder="Jan yo itilize l tradisyonèlman pou sipòte…" /></label>
              <label className="text-xs font-semibold text-earth-700">Prekosyon <span className="text-earth-400 font-normal">(youn pa liy)</span><textarea className={cn(inputCls, 'min-h-[70px]')} value={form.cautions_kr} onChange={set('cautions_kr')} placeholder={'Pa pou gwosès\nEvite ak antikoagilan'} /></label>
              <label className="text-xs font-semibold text-earth-700">Estati
                <select className={inputCls} value={form.status} onChange={set('status')}>
                  <option value="draft">Bouyon (pa parèt)</option>
                  <option value="published">Pibliye</option>
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

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onMouseDown={() => setDelId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm p-5" onMouseDown={(e) => e.stopPropagation()}>
            <div className="font-display text-lg font-bold text-ink mb-1">Efase plant sa a?</div>
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
