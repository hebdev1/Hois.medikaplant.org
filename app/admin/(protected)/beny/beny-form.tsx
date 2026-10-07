'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useFormState, useFormStatus } from 'react-dom';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoverImageField } from '../guides/guide-form';
import { createBath, updateBath, uploadBathImage, type BathState } from './actions';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-8 text-sm text-earth-600 text-center">
      Ap chaje editè a…
    </div>
  ),
});

const input =
  'w-full px-3 py-2 rounded-lg bg-white border border-cream-200 text-sm text-ink placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 transition';

export type BathRecord = {
  id: string;
  slug: string;
  title: string;
  intention: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  display_order: number;
  published: boolean;
  ingredients: string[];
  preparation_html: string | null;
  usage_html: string | null;
  cautions_html: string | null;
  video_url: string | null;
};

export default function BenyForm({
  mode,
  bath,
}: {
  mode: 'create' | 'edit';
  bath?: BathRecord;
}) {
  const action = mode === 'edit' && bath ? updateBath.bind(null, bath.id) : createBath;
  const [state, formAction] = useFormState<BathState, FormData>(action, {});

  const [values, setValues] = React.useState({
    title: bath?.title ?? '',
    slug: bath?.slug ?? '',
    intention: bath?.intention ?? '',
    excerpt: bath?.excerpt ?? '',
    cover_image_url: bath?.cover_image_url ?? '',
    display_order: String(bath?.display_order ?? 0),
    ingredients: (bath?.ingredients ?? []).join('\n'),
    preparation_html: bath?.preparation_html ?? '',
    usage_html: bath?.usage_html ?? '',
    cautions_html: bath?.cautions_html ?? '',
    video_url: bath?.video_url ?? '',
  });
  const set = (k: keyof typeof values, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Non beny lan *</span>
          <input name="title" required value={values.title} onChange={(e) => set('title', e.target.value)} className={input} placeholder="Beny pwoteksyon ak fèy bazilik" />
        </label>

        <div className="grid sm:grid-cols-[220px_1fr] gap-4">
          <label className="block">
            <span className="block text-xs font-semibold text-earth-700 mb-1">Entansyon</span>
            <input name="intention" value={values.intention} onChange={(e) => set('intention', e.target.value)} className={input} placeholder="Pwoteksyon, Chans, Netwayaj…" maxLength={60} />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-earth-700 mb-1">Rezime kout</span>
            <input name="excerpt" value={values.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={input} placeholder="Yon fraz ki di pou kisa beny lan ye" />
          </label>
        </div>
        <p className="-mt-2 text-[11px] text-earth-500">
          Non, entansyon, rezime ak foto a vizib pou tout manm (apèsi). Rès resèt la se pou manm Melis sèlman.
        </p>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Engredyan (yon pa liy)</span>
          <textarea
            name="ingredients"
            rows={6}
            value={values.ingredients}
            onChange={(e) => set('ingredients', e.target.value)}
            className={cn(input, 'resize-y font-mono text-[13px]')}
            placeholder={'7 fèy bazilik\n1 ti branch womaren\n1 galon dlo'}
          />
        </label>

        <RichField
          label="Preparasyon *"
          hint="Obligatwa pou pibliye."
          name="preparation_html"
          value={values.preparation_html}
          onChange={(v) => set('preparation_html', v)}
          placeholder="Kijan pou prepare beny lan, etap pa etap…"
        />
        <RichField
          label="Kijan pou benyen"
          hint="Ki lè, konbyen jou, sa pou fè apre."
          name="usage_html"
          value={values.usage_html}
          onChange={(v) => set('usage_html', v)}
          placeholder="Pran beny lan nan aswè, 3 jou youn dèyè lòt…"
        />
        <RichField
          label="Prekosyon"
          name="cautions_html"
          value={values.cautions_html}
          onChange={(v) => set('cautions_html', v)}
          placeholder="Pa pran l si w ansent, evite je yo…"
        />

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Videyo (opsyonèl)</span>
          <input name="video_url" type="url" value={values.video_url} onChange={(e) => set('video_url', e.target.value)} className={cn(input, 'font-mono text-xs')} placeholder="https://www.youtube.com/watch?v=…" />
        </label>
      </div>

      <aside className="space-y-4">
        {state.error && (
          <p className="text-xs text-rose-700 flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-xs text-forest-700 flex items-center gap-1.5 rounded-lg bg-forest-50 border border-forest-200 px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            Anrejistre.
          </p>
        )}

        <div>
          <span className="block text-xs font-semibold text-earth-700 mb-1">Foto</span>
          <CoverImageField
            value={values.cover_image_url}
            onChange={(url) => set('cover_image_url', url)}
            upload={uploadBathImage}
          />
          <input type="hidden" name="cover_image_url" value={values.cover_image_url} />
        </div>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Slug (opsyonèl)</span>
          <input name="slug" value={values.slug} onChange={(e) => set('slug', e.target.value)} className={cn(input, 'font-mono text-xs')} placeholder="auto" />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Lòd (0 = an premye)</span>
          <input name="display_order" type="number" min={0} value={values.display_order} onChange={(e) => set('display_order', e.target.value)} className={input} />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="published" defaultChecked={bath?.published ?? false} className="w-4 h-4" />
          Pibliye (vizib pou manm yo)
        </label>

        <SubmitButton mode={mode} />
      </aside>
    </form>
  );
}

function RichField({
  label,
  hint,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  name: string;
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <span className="block text-xs font-semibold text-earth-700 mb-1">
        {label}
        {hint && <span className="ml-1.5 font-normal text-earth-500">{hint}</span>}
      </span>
      <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} uploadImage={uploadBathImage} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition disabled:opacity-60"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} /> : <Save className="w-4 h-4" strokeWidth={2.4} />}
      {mode === 'create' ? 'Kreye beny lan' : 'Anrejistre chanjman yo'}
    </button>
  );
}
