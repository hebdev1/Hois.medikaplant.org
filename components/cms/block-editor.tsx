'use client';

// Reusable block-list editor shared by the Pages and Articles editors: add,
// reorder (up/down), delete, and per-type field inputs. Rendering of blocks
// (for preview + public) lives in ./page-blocks.

import React from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Trash2, Plus, LayoutTemplate, Loader2, Images } from 'lucide-react';
import { newBlock, BLOCK_LABELS, type Block, type BlockType } from './page-blocks';
import {
  listBlockTemplates,
  type BlockTemplate,
} from '@/app/admin/(protected)/templates/actions';
import RichTextEditor from '@/components/admin/rich-text-editor';
import { MediaPicker } from './media-picker';

function reid(blocks: Block[]): Block[] {
  const gen = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return blocks.map((b) => ({ ...b, id: gen() }));
}

const BLOCK_ORDER: BlockType[] = ['heading', 'paragraph', 'richtext', 'image', 'button', 'badge', 'divider'];

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [templates, setTemplates] = React.useState<BlockTemplate[] | null>(null);
  const [tplOpen, setTplOpen] = React.useState(false);
  const [tplLoading, setTplLoading] = React.useState(false);

  async function openTemplates() {
    const next = !tplOpen;
    setTplOpen(next);
    if (next && templates === null) {
      setTplLoading(true);
      const list = await listBlockTemplates();
      setTemplates(list);
      setTplLoading(false);
    }
  }
  function insertTemplate(t: BlockTemplate) {
    onChange([...blocks, ...reid(t.blocks)]);
    setTplOpen(false);
  }

  function patchBlock(id: string, patch: Record<string, unknown>) {
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  }
  function remove(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }
  function add(type: BlockType) {
    onChange([...blocks, newBlock(type)]);
  }

  return (
    <section className="space-y-3">
      {blocks.length === 0 && (
        <div className="text-center text-sm text-earth-500 py-8 border-2 border-dashed border-cream-300 rounded-2xl">
          Poko gen blòk. Ajoute youn anba a.
        </div>
      )}
      {blocks.length > 0 && (
        <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="space-y-3">
          {blocks.map((b) => (
            <BlockRow
              key={b.id}
              block={b}
              onPatch={(patch) => patchBlock(b.id, patch)}
              onRemove={() => remove(b.id)}
            />
          ))}
        </Reorder.Group>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {BLOCK_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => add(t)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-cream-300 bg-white text-earth-700 text-xs font-semibold hover:border-forest-300 hover:text-forest-700 transition"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
            {BLOCK_LABELS[t]}
          </button>
        ))}

        {/* Insert a saved reusable template */}
        <div className="relative">
          <button
            type="button"
            onClick={openTemplates}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gold-300 bg-white text-gold-700 text-xs font-semibold hover:border-gold-400 transition"
          >
            <LayoutTemplate className="w-3.5 h-3.5" strokeWidth={2.4} />
            Modèl
          </button>
          {tplOpen && (
            <div className="absolute left-0 bottom-full mb-1 z-10 w-60 max-h-60 overflow-y-auto bg-white border border-cream-200 rounded-xl shadow-2xl p-1">
              {tplLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-earth-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ap chaje…
                </div>
              ) : templates && templates.length > 0 ? (
                templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => insertTemplate(t)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-cream-100 transition truncate"
                  >
                    {t.name}
                    <span className="text-earth-400 ml-1">· {t.blocks.length} blòk</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-earth-500 italic">
                  Pa gen modèl. Kreye youn nan “Modèl”.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BlockRow({
  block,
  onPatch,
  onRemove,
}: {
  block: Block;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="bg-white border border-cream-200 rounded-2xl shadow-card p-4"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Trennen pou reòganize"
            onPointerDown={(e) => controls.start(e)}
            className="grid place-items-center w-6 h-6 -ml-1 rounded text-earth-400 hover:text-earth-700 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4" strokeWidth={2} />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700">
            {BLOCK_LABELS[block.type]}
          </span>
        </div>
        <IconBtn label="Efase" onClick={onRemove} danger>
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.4} />
        </IconBtn>
      </div>
      <BlockFields block={block} onChange={onPatch} />
    </Reorder.Item>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`grid place-items-center w-7 h-7 rounded-lg transition disabled:opacity-30 ${
        danger
          ? 'text-earth-400 hover:text-rose-600 hover:bg-rose-50'
          : 'text-earth-500 hover:text-ink hover:bg-cream-100'
      }`}
    >
      {children}
    </button>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: Block;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';
  switch (block.type) {
    case 'heading':
      return (
        <div className="flex gap-2">
          <input
            value={block.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className={inputCls}
            placeholder="Tèks tit la"
          />
          <select
            value={block.level}
            onChange={(e) => onChange({ level: Number(e.target.value) as 2 | 3 })}
            className="px-2 py-2 rounded-lg border border-cream-200 text-sm bg-white shrink-0"
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
        </div>
      );
    case 'paragraph':
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
          className={`${inputCls} resize-y`}
          placeholder="Ekri paragraf la…"
        />
      );
    case 'richtext':
      return (
        <RichTextEditor
          value={block.html}
          onChange={(html) => onChange({ html })}
          minHeight={160}
          placeholder="Ekri kontni rich la…"
        />
      );
    case 'image':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={block.url}
              onChange={(e) => onChange({ url: e.target.value })}
              className={`${inputCls} font-mono text-xs`}
              placeholder="URL imaj oswa chwazi nan Medya"
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg border border-cream-300 bg-white text-earth-700 text-xs font-semibold hover:border-forest-300 hover:text-forest-700 transition"
            >
              <Images className="w-3.5 h-3.5" strokeWidth={2.2} /> Medya
            </button>
          </div>
          {block.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.url}
              alt=""
              className="max-h-40 rounded-lg border border-cream-200 object-contain"
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              value={block.alt ?? ''}
              onChange={(e) => onChange({ alt: e.target.value })}
              className={inputCls}
              placeholder="Alt text"
            />
            <input
              value={block.caption ?? ''}
              onChange={(e) => onChange({ caption: e.target.value })}
              className={inputCls}
              placeholder="Lejand"
            />
          </div>
          {pickerOpen && (
            <MediaPicker
              onClose={() => setPickerOpen(false)}
              onPick={(asset) => {
                onChange({
                  url: asset.url,
                  alt: block.alt || asset.alt_text || asset.title || '',
                });
                setPickerOpen(false);
              }}
            />
          )}
        </div>
      );
    case 'button':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={block.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className={inputCls}
              placeholder="Tèks bouton"
            />
            <select
              value={block.variant}
              onChange={(e) => onChange({ variant: e.target.value as 'primary' | 'secondary' })}
              className="px-3 py-2 rounded-lg border border-cream-200 text-sm bg-white"
            >
              <option value="primary">Prensipal</option>
              <option value="secondary">Segondè</option>
            </select>
          </div>
          <input
            value={block.href}
            onChange={(e) => onChange({ href: e.target.value })}
            className={`${inputCls} font-mono text-xs`}
            placeholder="Lyen (/paj/…, /laboratwa, oswa https://…)"
          />
        </div>
      );
    case 'badge':
      return (
        <div className="space-y-2">
          <input
            value={block.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className={inputCls}
            placeholder="Tèks badj la (egz. Nouvo)"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={block.variant}
              onChange={(e) => onChange({ variant: e.target.value })}
              className="px-3 py-2 rounded-lg border border-cream-200 text-sm bg-white"
            >
              <option value="primary">Vèt (prensipal)</option>
              <option value="secondary">Lò</option>
              <option value="success">Siksè (vèt klè)</option>
              <option value="warning">Avètisman</option>
              <option value="error">Erè (wouj)</option>
            </select>
            <select
              value={block.appearance}
              onChange={(e) => onChange({ appearance: e.target.value })}
              className="px-3 py-2 rounded-lg border border-cream-200 text-sm bg-white"
            >
              <option value="subtle">Dou</option>
              <option value="solid">Plen</option>
              <option value="outline">Kontou</option>
            </select>
          </div>
        </div>
      );
    case 'divider':
      return <div className="text-xs text-earth-400 italic">Yon liy separasyon.</div>;
  }
}
