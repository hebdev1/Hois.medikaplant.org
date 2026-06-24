'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Save,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Sprout,
  Mountain,
  Heart,
  Activity,
  GraduationCap,
  BookOpen,
  Video,
  Users,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveCategory, deleteCategory, type CategoryState } from './actions';

type Initial = {
  id: string;
  slug: string;
  title: string;
  body: string;
  icon: string;
  tone: string;
  display_order: number;
  active: boolean;
};

const ICONS: Array<{ value: string; Icon: LucideIcon }> = [
  { value: 'leaf', Icon: Leaf },
  { value: 'sprout', Icon: Sprout },
  { value: 'mountain', Icon: Mountain },
  { value: 'heart', Icon: Heart },
  { value: 'activity', Icon: Activity },
  { value: 'graduation-cap', Icon: GraduationCap },
  { value: 'book-open', Icon: BookOpen },
  { value: 'video', Icon: Video },
  { value: 'users', Icon: Users },
  { value: 'star', Icon: Star },
];

const TONES = [
  { value: 'from-brand-500 to-brand-700', label: 'Brand vèt' },
  { value: 'from-accent to-rose-700', label: 'Aksan woz' },
  { value: 'from-amber-500 to-amber-700', label: 'Anbre' },
  { value: 'from-sky-500 to-sky-700', label: 'Syèl' },
  { value: 'from-rose-500 to-rose-700', label: 'Roz' },
  { value: 'from-indigo-500 to-indigo-700', label: 'Endigo' },
];

type Props =
  | { mode: 'create'; initial?: undefined }
  | { mode: 'edit'; initial: Initial };

export default function CategoryEditor(props: Props) {
  const isEdit = props.mode === 'edit';
  const id = isEdit ? props.initial.id : null;
  const action = saveCategory.bind(null, id);
  const [state, formAction] = useFormState<CategoryState, FormData>(action, {});

  const [values, setValues] = React.useState({
    title: isEdit ? props.initial.title : '',
    slug: isEdit ? props.initial.slug : '',
    body: isEdit ? props.initial.body : '',
    icon: isEdit ? props.initial.icon : 'leaf',
    tone: isEdit ? props.initial.tone : TONES[0].value,
    display_order: isEdit ? props.initial.display_order : 0,
    active: isEdit ? props.initial.active : true,
  });

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <form
      action={formAction}
      className={cn(
        'bg-white border rounded-2xl p-4 md:p-5 space-y-3',
        isEdit ? 'border-cream-200' : 'border-forest-200 border-dashed bg-forest-50/40'
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          {isEdit ? props.initial.title : 'Nouvo kategori'}
        </h3>
        {isEdit && <DeleteCategoryButton id={props.initial.id} />}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Tit">
          <input
            name="title"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Slug">
          <input
            name="slug"
            value={values.slug}
            onChange={(e) => set('slug', e.target.value)}
            className={cn(inputClass, 'font-mono')}
            placeholder="auto-soti-nan-tit-la"
          />
        </Field>
      </div>
      <Field label="Deskripsyon">
        <textarea
          name="body"
          value={values.body}
          onChange={(e) => set('body', e.target.value)}
          rows={2}
          className={cn(inputClass, 'resize-y')}
          required
        />
      </Field>
      <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
        <Field label="Ikòn">
          <div className="flex flex-wrap gap-1">
            {ICONS.map(({ value, Icon }) => {
              const active = values.icon === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('icon', value)}
                  title={value}
                  className={cn(
                    'grid place-items-center w-8 h-8 rounded-lg border transition',
                    active
                      ? 'bg-forest-700 border-forest-700 text-cream-50'
                      : 'border-cream-200 text-earth-700 hover:bg-cream-100'
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </button>
              );
            })}
          </div>
          <input type="hidden" name="icon" value={values.icon} />
        </Field>
        <Field label="Koulè">
          <select
            name="tone"
            value={values.tone}
            onChange={(e) => set('tone', e.target.value)}
            className={inputClass}
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lòd">
          <input
            type="number"
            name="display_order"
            min={0}
            value={values.display_order}
            onChange={(e) =>
              set('display_order', Math.max(0, Number(e.target.value) || 0))
            }
            className={cn(inputClass, 'w-20')}
          />
        </Field>
        <label className="flex items-center gap-2 text-xs font-semibold text-earth-700">
          <input
            type="checkbox"
            name="active"
            checked={values.active}
            onChange={(e) => set('active', e.target.checked)}
            className="accent-forest-700"
          />
          Aktif
        </label>
      </div>
      <SubmitFooter state={state} label={isEdit ? 'Anrejistre' : 'Kreye'} />
    </form>
  );
}

function SubmitFooter({ state, label }: { state: CategoryState; label: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : (
          <Save className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        {label}
      </button>
      {state.error && (
        <span className="text-xs text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {state.error}
        </span>
      )}
      {state.ok && (
        <span className="text-xs text-forest-700 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} /> Anrejistre.
        </span>
      )}
    </div>
  );
}

function DeleteCategoryButton({ id }: { id: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setPending(true);
    try {
      await deleteCategory(id);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={confirming ? 'Klike yon dezyèm fwa' : 'Efase'}
      className={cn(
        'grid place-items-center w-7 h-7 rounded-lg transition',
        confirming
          ? 'bg-rose-600 text-white hover:bg-rose-700'
          : 'text-rose-600 hover:bg-rose-50'
      )}
    >
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
      ) : (
        <Trash2 className="w-3 h-3" strokeWidth={2.2} />
      )}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-earth-600">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';
