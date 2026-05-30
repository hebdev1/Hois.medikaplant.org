'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createAdvice,
  updateAdvice,
  type AdviceFormState,
} from './actions';
import type { Database } from '@/types/database';

type AdviceRow = Database['public']['Tables']['daily_advice']['Row'];

const INITIAL: AdviceFormState = {};

/**
 * Inline composer used both for today's advice (creates new or edits the
 * existing row of the day) and as the row-actions edit form. When
 * `initial` is provided, it switches to update mode.
 */
export default function AdviceComposer({
  initial,
  defaultDate,
  onDone,
}: {
  initial: AdviceRow | null;
  defaultDate: string;
  /** Called after a successful save — used by the row-actions edit panel. */
  onDone?: () => void;
}) {
  const action = initial
    ? updateAdvice.bind(null, initial.id)
    : createAdvice;
  const [state, formAction] = useFormState<AdviceFormState, FormData>(
    action,
    INITIAL
  );
  const formRef = React.useRef<HTMLFormElement | null>(null);

  React.useEffect(() => {
    if (state.ok) {
      if (!initial && formRef.current) formRef.current.reset();
      if (onDone) {
        const t = setTimeout(onDone, 600);
        return () => clearTimeout(t);
      }
    }
  }, [state.ok, initial, onDone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Dat piblikasyon" required>
          <input
            type="date"
            name="publish_date"
            required
            defaultValue={initial?.publish_date ?? defaultDate}
            className={inputClass}
          />
        </Field>
        <Field label="Plan minimòm" required>
          <select
            name="plan_required"
            defaultValue={initial?.plan_required ?? 'basic'}
            className={inputClass}
          >
            <option value="basic">Bazilik (tout manm)</option>
            <option value="premium">Sitwonèl (Premium+)</option>
            <option value="vip">Melis (VIP sèlman)</option>
          </select>
        </Field>
      </div>

      <Field
        label="Mesaj"
        required
        help="HTML otorize pou yon ti enfaz (ex: <em>plant la</em>). 6–4000 karaktè."
      >
        <textarea
          name="body_html"
          required
          rows={4}
          minLength={6}
          maxLength={4000}
          defaultValue={initial?.body_html ?? ''}
          placeholder="Jodi a, evite <em>sik rafine a</em>. Bwè plis dlo, e prepare yon tas tizan <em>mounn-bwa</em> apre manje midi…"
          className={cn(inputClass, 'leading-relaxed resize-y font-serif')}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Plant prensipal" help="Non + non syantifik si w vle">
          <input
            type="text"
            name="plant_name"
            defaultValue={initial?.plant_name ?? ''}
            placeholder="Mounn-bwa — Cnidoscolus chayamansa"
            className={inputClass}
          />
        </Field>
        <Field label="Dire (segond, opsyonèl)" help="Pou kat 'Koute (X min)'">
          <input
            type="number"
            name="duration_seconds"
            min={10}
            max={3600}
            defaultValue={initial?.duration_seconds ?? ''}
            placeholder="120"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="URL odyo (opsyonèl)" help="MP3 oswa lyen ki rive nan yon fichye odyo.">
        <input
          type="url"
          name="audio_url"
          defaultValue={initial?.audio_url ?? ''}
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      {state.error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div className="rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>
            {initial ? 'Chanjman anrejistre.' : 'Konsèy pibliye — manm yo ap wè li sou tablodebò a.'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <SubmitButton isEdit={!!initial} />
      </div>
    </form>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Field({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {help && <p className="text-[11px] text-earth-500 mt-1 leading-snug">{help}</p>}
    </label>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
      ) : isEdit ? (
        <Save className="w-4 h-4" strokeWidth={2.4} />
      ) : (
        <Sparkles className="w-4 h-4" strokeWidth={2.4} />
      )}
      {isEdit ? 'Anrejistre chanjman' : 'Pibliye konsèy la'}
    </button>
  );
}
