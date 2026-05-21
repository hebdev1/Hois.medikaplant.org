'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Pill,
  Leaf,
  Activity,
  Eye,
  ArrowRight,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createTreatment,
  type AdminTreatmentState,
} from '../actions';

type Kind = 'medication' | 'herbal' | 'lifestyle' | 'monitoring' | 'referral';

const KIND_OPTIONS: { value: Kind; label: string; icon: typeof Pill }[] = [
  { value: 'medication', label: 'Medikaman', icon: Pill },
  { value: 'herbal', label: 'Tizan / Plant', icon: Leaf },
  { value: 'lifestyle', label: 'Abitid lavi', icon: Activity },
  { value: 'monitoring', label: 'Swivi mezi', icon: Eye },
  { value: 'referral', label: 'Referans', icon: ArrowRight },
];

const METRIC_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Pa konekte ak mezi —' },
  { value: 'blood_sugar', label: 'Sik nan san' },
  { value: 'weight', label: 'Pwa kò' },
  { value: 'pressure', label: 'Tansyon' },
];

export default function PrescriptionForm({
  userId,
  conditions,
}: {
  userId: string;
  conditions: string[];
}) {
  const action = createTreatment.bind(null, userId);
  const [state, formAction] = useFormState<AdminTreatmentState, FormData>(
    action,
    {}
  );

  const [kind, setKind] = React.useState<Kind>('herbal');
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = React.useState(false);

  // Reset form on successful submission
  React.useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
      setKind('herbal');
    }
  }, [state.ok]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-xl transition shadow-plant"
      >
        <Plus className="w-4 h-4" strokeWidth={2.4} />
        Pwopoze yon tretman
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-forest-200 bg-forest-50/30 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">
          Nouvo pwopozisyon
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-earth-700 hover:text-ink"
        >
          Fèmen
        </button>
      </div>

      <Field label="Tip" required>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {KIND_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = kind === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border transition',
                  active
                    ? 'bg-white border-forest-300 ring-2 ring-forest-200'
                    : 'bg-white border-cream-200 hover:border-forest-200'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    active ? 'text-forest-700' : 'text-earth-600'
                  )}
                  strokeWidth={2}
                />
                <span className="text-[10px] font-semibold text-ink leading-tight text-center">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="kind" value={kind} />
      </Field>

      <Field label="Tit" required help="Yon ti deskripsyon kout (egz: 'Tizan mounn-bwa chak maten').">
        <input
          type="text"
          name="title"
          required
          minLength={2}
          maxLength={200}
          className={inputClass}
        />
      </Field>

      <Field
        label="Deskripsyon / enstriksyon"
        required
        help="Eksplikasyon konplè pou pasyan an — sa pou fè, kilè, eks."
      >
        <textarea
          name="description"
          required
          rows={4}
          minLength={4}
          maxLength={4000}
          className={cn(inputClass, 'leading-relaxed resize-y')}
        />
      </Field>

      {(kind === 'medication' || kind === 'herbal') && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Dòz" help="Egz: 500 mg, 2 tas, 1 kiyè a tab">
            <input type="text" name="dose" className={inputClass} placeholder="500 mg" />
          </Field>
          <Field label="Frekans" help="Egz: 2 fwa pa jou, chak maten">
            <input type="text" name="frequency" className={inputClass} placeholder="2 fwa pa jou" />
          </Field>
          <Field label="Dire">
            <input type="text" name="duration" className={inputClass} placeholder="14 jou" />
          </Field>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Konekte ak mezi" help="Pou pasyan an wè li sou paj Swivi Sante.">
          <select name="related_metric" defaultValue="" className={inputClass}>
            {METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Konekte ak kondisyon">
          <select name="related_condition" defaultValue="" className={inputClass}>
            <option value="">— Okenn —</option>
            {conditions.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Dat kòmanse">
          <input
            type="date"
            name="start_date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </Field>
        <Field label="Dat fini (opsyonèl)">
          <input type="date" name="end_date" className={inputClass} />
        </Field>
      </div>

      <Field label="Nòt entèn (opsyonèl)" help="Sa pasyan an pa wè — pou rejis ou.">
        <textarea name="notes" rows={2} className={cn(inputClass, 'resize-y')} />
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
          <span>Pwopozisyon voye bay pasyan an.</span>
        </div>
      )}

      <Submit />
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

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-xl transition"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
      ) : (
        <Save className="w-4 h-4" strokeWidth={2.4} />
      )}
      Voye pwopozisyon bay pasyan an
    </button>
  );
}
