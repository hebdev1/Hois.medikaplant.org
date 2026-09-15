'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, Plus, Loader2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { BlockEditor } from '@/components/cms/block-editor';
import { PageBlocks, type Block } from '@/components/cms/page-blocks';
import { saveBlockTemplate, deleteBlockTemplate } from './actions';

type Template = { id: string; name: string; blocks: Block[] };

export default function TemplatesAdmin({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Template | 'new' | null>(null);

  if (editing) {
    return (
      <TemplateEditor
        template={editing === 'new' ? null : editing}
        onDone={() => {
          setEditing(null);
          router.refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <LayoutTemplate className="w-3.5 h-3.5" strokeWidth={2.2} />
            Modèl
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">Modèl blòk</h1>
          <p className="mt-1.5 text-sm text-earth-600">
            Sove yon seri blòk pou reitilize yo nan nenpòt Paj oswa Atik (bouton “Modèl”).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Nouvo modèl
        </button>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">Poko gen modèl.</div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 md:px-5 py-3.5">
                <LayoutTemplate className="w-4 h-4 text-gold-500 shrink-0" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink truncate">{t.name}</div>
                  <div className="text-xs text-earth-500">{t.blocks.length} blòk</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                >
                  Modifye
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TemplateEditor({
  template,
  onDone,
  onCancel,
}: {
  template: Template | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(template?.name ?? '');
  const [blocks, setBlocks] = React.useState<Block[]>(template?.blocks ?? []);
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await saveBlockTemplate({ id: template?.id, name, blocks });
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error ?? 'Echwe.');
  }
  async function remove() {
    if (!template?.id) return;
    setBusy(true);
    const res = await deleteBlockTemplate(template.id);
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error ?? 'Echwe.');
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-ink">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
          Modèl yo
        </button>
        <div className="flex-1" />
        {template && (
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
        )}
        <button
          type="button"
          onClick={save}
          disabled={busy || !name.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2.2} />}
          Anrejistre
        </button>
      </header>

      {err && <div className="mb-4 text-sm rounded-xl px-3.5 py-2.5 border bg-rose-50 border-rose-200 text-rose-800">{err}</div>}

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-5">
          <label className="block bg-white border border-cream-200 rounded-2xl shadow-card p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Non modèl la</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Egz. Seksyon “Hero + 2 paragraf”"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </label>
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>
        <aside className="lg:sticky lg:top-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-earth-500 mb-2">Apèsi</div>
          <div className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 max-h-[70vh] overflow-y-auto">
            {blocks.length === 0 ? (
              <p className="text-sm text-earth-400 italic">Ajoute blòk…</p>
            ) : (
              <PageBlocks blocks={blocks} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
