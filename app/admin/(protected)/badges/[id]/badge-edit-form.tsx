'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateBadge, type BadgeFormState } from '../actions';
import type { Database } from '@/types/database';

type BadgeRow = Database['public']['Tables']['badges']['Row'];

const ICON_OPTIONS: Array<{ value: BadgeRow['icon']; label: string }> = [
  { value: 'sprout', label: '🌱 Sprout' },
  { value: 'leaf', label: '🍃 Leaf' },
  { value: 'droplet', label: '💧 Droplet' },
  { value: 'flame', label: '🔥 Flame' },
  { value: 'activity', label: '📈 Activity' },
  { value: 'target', label: '🎯 Target' },
  { value: 'calendar', label: '📅 Calendar' },
  { value: 'star', label: '⭐ Star' },
];

const initialState: BadgeFormState = {};

export default function BadgeEditForm({
  badge,
  metricLabel,
  unit,
}: {
  badge: BadgeRow;
  metricLabel: string;
  unit: string;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(
    (prev: BadgeFormState, fd: FormData) => updateBadge(badge.id, prev, fd),
    initialState
  );

  // After a successful save, refresh so the preview card + list reflect the
  // new values without re-mounting the form (preserves the inline success
  // banner for ~1s).
  useEffect(() => {
    if (state.ok) {
      const timer = setTimeout(() => router.refresh(), 600);
      return () => clearTimeout(timer);
    }
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 md:p-6 space-y-5"
    >
      {/* Banner */}
      {state.error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div className="rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800 flex items-start gap-2">
          <CheckCircle2
            className="w-4 h-4 mt-0.5 shrink-0"
            strokeWidth={2.4}
          />
          <span>Anrejistre.</span>
        </div>
      )}

      <Field label="Non" htmlFor="name" required>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={badge.name}
          maxLength={80}
          className={inputCls}
          required
        />
      </Field>

      <Field
        label="Sub-tit"
        htmlFor="sub"
        hint="Yon ti fraz kout anba non an, egzanp “7 jou san sote”."
      >
        <input
          id="sub"
          name="sub"
          type="text"
          defaultValue={badge.sub ?? ''}
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field
        label="Deskripsyon"
        htmlFor="description"
        hint="Tèks long ki parèt sou paj detay la pou manm yo."
      >
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={badge.description ?? ''}
          className={`${inputCls} resize-y leading-relaxed`}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Ikòn" htmlFor="icon">
          <select
            id="icon"
            name="icon"
            defaultValue={badge.icon}
            className={inputCls}
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={`Sèyi (${metricLabel}${unit ? ` an ${unit}` : ''})`}
          htmlFor="criteria_threshold"
          hint="Konbyen pou debloke. Atansyon: chanjman afekte pwogresyon tout manm yo."
        >
          <input
            id="criteria_threshold"
            name="criteria_threshold"
            type="number"
            min={1}
            max={9999}
            step={1}
            defaultValue={badge.criteria_threshold}
            className={inputCls}
            required
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          label="Pòz nan lis (display_order)"
          htmlFor="display_order"
          hint="Pi piti = parèt anvan."
        >
          <input
            id="display_order"
            name="display_order"
            type="number"
            min={0}
            max={999}
            step={1}
            defaultValue={badge.display_order}
            className={inputCls}
          />
        </Field>

        <div className="flex items-end pb-1.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={badge.active}
              className="w-4 h-4 rounded border-cream-300 text-forest-700 focus:ring-forest-300"
            />
            <span className="font-semibold text-ink">
              Mete badj sa aktif
            </span>
            <span className="text-xs text-earth-500">
              (parèt nan galri manm yo)
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-earth-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 transition';

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-bold uppercase tracking-wider text-earth-700"
      >
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-earth-500">{hint}</p>}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-sm font-semibold transition"
    >
      <Save className="w-3.5 h-3.5" strokeWidth={2.4} />
      {pending ? 'Anrejistreman...' : 'Anrejistre chanjman'}
    </button>
  );
}
