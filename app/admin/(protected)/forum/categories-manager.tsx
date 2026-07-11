'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Plus,
  Save,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Edit2,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  adminUpsertCategory,
  adminDeleteCategory,
  type CategoryState,
} from './actions';
import type { Database } from '@/types/database';

type Category = Database['public']['Tables']['forum_categories']['Row'];

export default function CategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-cream-50 to-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 text-white shadow">
            <Tag className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-ink leading-tight">
              Kategori yo
            </h2>
            <p className="text-[11px] text-earth-600 mt-0.5">
              {categories.length} kategori · klike sou yon liy pou modifye
            </p>
          </div>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            Nouvo
          </button>
        )}
      </header>

      <div className="divide-y divide-cream-100">
        {creating && (
          <CategoryForm
            onCancel={() => setCreating(false)}
            onSuccess={() => setCreating(false)}
          />
        )}
        {categories.map((c) =>
          editing === c.id ? (
            <CategoryForm
              key={c.id}
              category={c}
              onCancel={() => setEditing(null)}
              onSuccess={() => setEditing(null)}
            />
          ) : (
            <CategoryRow
              key={c.id}
              category={c}
              onEdit={() => {
                setEditing(c.id);
                setCreating(false);
              }}
            />
          )
        )}
        {categories.length === 0 && !creating && (
          <div className="px-5 py-8 text-center text-sm text-earth-600 italic">
            Pa gen kategori. Kreye youn pou kominote a ka chwazi.
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryRow({
  category,
  onEdit,
}: {
  category: Category;
  onEdit: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete() {
    if (
      !window.confirm(
        `Efase kategori "${category.name}"? Sijè ki ladann yo ap rete men san kategori.`
      )
    ) {
      return;
    }
    setError(null);
    setPending(true);
    const res = await adminDeleteCategory(category.id);
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <span
        className="grid place-items-center w-10 h-10 rounded-xl text-lg shrink-0"
        style={{
          background: `${category.color}1A`,
          color: category.color,
          border: `1px solid ${category.color}40`,
        }}
      >
        {category.icon ?? '💬'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink truncate">
            {category.name}
          </span>
          <code className="text-[10px] font-mono text-earth-500 bg-cream-100 px-1.5 py-0.5 rounded">
            /{category.slug}
          </code>
        </div>
        {category.description && (
          <p className="text-[11px] text-earth-600 mt-0.5 line-clamp-1">
            {category.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Modifye"
          className="grid place-items-center w-8 h-8 rounded-lg text-earth-700 hover:text-forest-700 hover:bg-forest-50 transition"
        >
          <Edit2 className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          aria-label="Efase"
          className="grid place-items-center w-8 h-8 rounded-lg text-earth-500 hover:text-rose-700 hover:bg-rose-50 transition disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
          ) : (
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          )}
        </button>
      </div>
      {error && (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-rose-700">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
          {error}
        </span>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onCancel,
  onSuccess,
}: {
  category?: Category;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, action] = useFormState<CategoryState, FormData>(
    adminUpsertCategory,
    {}
  );

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form
      action={action}
      className={cn(
        'px-5 py-4 grid grid-cols-1 sm:grid-cols-[100px_1fr_1fr_70px_auto] gap-3 items-end',
        'bg-gradient-to-r from-forest-50/40 to-transparent'
      )}
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="sm:col-span-1">
        <label className="block text-[10px] font-bold uppercase tracking-wide text-earth-700 mb-1">
          Ikòn
        </label>
        <input
          type="text"
          name="icon"
          defaultValue={category?.icon ?? '💬'}
          maxLength={4}
          placeholder="💬"
          className="w-full px-2 py-2 text-lg bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-center"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-earth-700 mb-1">
          Non
        </label>
        <input
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={60}
          defaultValue={category?.name ?? ''}
          placeholder="ex. Plant medisinal"
          className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-earth-700 mb-1">
          Deskripsyon
        </label>
        <input
          type="text"
          name="description"
          maxLength={200}
          defaultValue={category?.description ?? ''}
          placeholder="ti deskripsyon"
          className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-earth-700 mb-1">
          Koulè
        </label>
        <input
          type="color"
          name="color"
          defaultValue={category?.color ?? '#65881a'}
          className="w-full h-9 px-1 py-1 bg-white border border-cream-200 rounded-lg cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="hidden"
          name="display_order"
          value={category?.display_order ?? 99}
        />
        <SubmitButton creating={!category} />
        <button
          type="button"
          onClick={onCancel}
          aria-label="Anile"
          className="grid place-items-center w-9 h-9 rounded-lg text-earth-600 hover:bg-cream-100 transition"
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
        </button>
      </div>
      {state.error && (
        <div className="sm:col-span-5 flex items-center gap-2 text-xs text-rose-700 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
          {state.error}
        </div>
      )}
    </form>
  );
}

function SubmitButton({ creating }: { creating: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
      ) : creating ? (
        <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
      ) : (
        <Save className="w-3.5 h-3.5" strokeWidth={2.4} />
      )}
      {creating ? 'Kreye' : 'Sove'}
    </button>
  );
}
