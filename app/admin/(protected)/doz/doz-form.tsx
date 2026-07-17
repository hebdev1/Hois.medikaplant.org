'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useFormState, useFormStatus } from 'react-dom';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createDoz, updateDoz, uploadDozImage, type DozState } from './actions';

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

export type DozRecipe = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string | null;
  category_id: string | null;
  tag: string | null;
  cover_image_url: string | null;
  published: boolean;
};
export type DozCategoryOption = { id: string; label: string };

export default function DozForm({
  mode,
  recipe,
  categories,
}: {
  mode: 'create' | 'edit';
  recipe?: DozRecipe;
  categories: DozCategoryOption[];
}) {
  const action =
    mode === 'edit' && recipe ? updateDoz.bind(null, recipe.id) : createDoz;
  const [state, formAction] = useFormState<DozState, FormData>(action, {});

  const [values, setValues] = React.useState({
    title: recipe?.title ?? '',
    slug: recipe?.slug ?? '',
    excerpt: recipe?.excerpt ?? '',
    body_html: recipe?.body_html ?? '',
    category_id: recipe?.category_id ?? '',
    tag: recipe?.tag ?? '',
    cover_image_url: recipe?.cover_image_url ?? '',
  });
  const set = (k: keyof typeof values, v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Tit *</span>
          <input name="title" required value={values.title} onChange={(e) => set('title', e.target.value)} className={input} placeholder="9 Dòz Natirèl pou Detòks" />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Ekstrè (rezime kout)</span>
          <textarea name="excerpt" rows={2} value={values.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={cn(input, 'resize-y')} />
        </label>

        <div>
          <span className="block text-xs font-semibold text-earth-700 mb-1">Kontni (dòz / resèt la) *</span>
          <RichTextEditor
            value={values.body_html}
            onChange={(html) => set('body_html', html)}
            placeholder="Ekri dòz ak fòmil la isit…"
            uploadImage={uploadDozImage}
          />
          <input type="hidden" name="body_html" value={values.body_html} />
        </div>
      </div>

      <aside className="space-y-4">
        {state.error && (
          <p className="text-xs text-rose-700 flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.4} />
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-xs text-forest-700 flex items-center gap-1.5 rounded-lg bg-forest-50 border border-forest-200 px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            Anrejistre.
          </p>
        )}

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Kategori</span>
          <select name="category_id" value={values.category_id} onChange={(e) => set('category_id', e.target.value)} className={input}>
            <option value="">— Pa gen —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Etikèt (tag)</span>
          <input name="tag" value={values.tag} onChange={(e) => set('tag', e.target.value)} className={input} placeholder="Detòks" />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Slug (opsyonèl)</span>
          <input name="slug" value={values.slug} onChange={(e) => set('slug', e.target.value)} className={cn(input, 'font-mono text-xs')} placeholder="auto" />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold text-earth-700 mb-1">Imaj kouvèti (URL)</span>
          <input name="cover_image_url" value={values.cover_image_url} onChange={(e) => set('cover_image_url', e.target.value)} className={cn(input, 'font-mono text-xs')} placeholder="https://…" />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="published" defaultChecked={recipe?.published ?? false} className="w-4 h-4" />
          Pibliye (vizib pou manm yo)
        </label>

        <SubmitButton mode={mode} />
      </aside>
    </form>
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
      {mode === 'create' ? 'Kreye resèt la' : 'Anrejistre chanjman yo'}
    </button>
  );
}
