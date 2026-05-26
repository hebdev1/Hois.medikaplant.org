'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Pill,
  Leaf,
  Activity,
  Eye,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  updateTreatment,
  setTreatmentStatus,
  deleteTreatment,
  type AdminTreatmentState,
} from '../actions';
import type { Database } from '@/types/database';

type Treatment = Database['public']['Tables']['treatment_recommendations']['Row'];
type Kind = 'medication' | 'herbal' | 'lifestyle' | 'monitoring' | 'referral';

const KIND_META: Record<
  Kind,
  { label: string; icon: typeof Pill; tone: string }
> = {
  medication: { label: 'Medikaman', icon: Pill, tone: 'bg-indigo-100 text-indigo-700' },
  herbal: { label: 'Tizan / Plant', icon: Leaf, tone: 'bg-forest-100 text-forest-700' },
  lifestyle: { label: 'Abitid', icon: Activity, tone: 'bg-amber-100 text-amber-700' },
  monitoring: { label: 'Swivi', icon: Eye, tone: 'bg-sky-100 text-sky-700' },
  referral: { label: 'Referans', icon: ArrowRight, tone: 'bg-rose-100 text-rose-700' },
};

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

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function TreatmentRow({
  treatment,
  conditions,
}: {
  treatment: Treatment;
  /**
   * The pasyan's known conditions list — same options the create form
   * uses, so the edit form mirrors the dropdown exactly.
   */
  conditions: string[];
}) {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <EditCard
        treatment={treatment}
        conditions={conditions}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <ViewCard treatment={treatment} onEdit={() => setEditing(true)} />
  );
}

/* ─── Display ──────────────────────────────────────────────────────────── */

function ViewCard({
  treatment: t,
  onEdit,
}: {
  treatment: Treatment;
  onEdit: () => void;
}) {
  const meta = KIND_META[t.kind as Kind] ?? KIND_META.monitoring;
  const Icon = meta.icon;
  const isCancelled = t.status === 'cancelled';
  const isCompleted = t.status === 'completed';

  return (
    <li
      className={cn(
        'grid grid-cols-[auto_1fr_auto] gap-3 items-start p-3 rounded-xl border',
        t.status === 'active'
          ? 'bg-cream-50 border-cream-200'
          : 'bg-cream-50/40 border-cream-200/60 opacity-80'
      )}
    >
      <span className={cn('grid place-items-center w-10 h-10 rounded-xl shrink-0', meta.tone)}>
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-ink truncate">
            {t.title}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-700 border border-cream-200 text-[9px] font-bold uppercase tracking-wide">
            {meta.label}
          </span>
          {isCancelled && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wide">
              Anile
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700 text-[9px] font-bold uppercase tracking-wide">
              <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
              Konplete
            </span>
          )}
          {t.read_at && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100 text-[9px] font-bold uppercase tracking-wide">
              <Eye className="w-2.5 h-2.5" strokeWidth={2.4} />
              Li
            </span>
          )}
        </div>
        <p className="text-xs text-earth-700 leading-relaxed mt-1 line-clamp-2 whitespace-pre-wrap">
          {t.description}
        </p>
        <div className="text-[11px] text-earth-500 mt-1 flex items-center gap-2 flex-wrap">
          <span>Voye {formatDate(t.created_at)}</span>
          {t.dose && (
            <>
              <span aria-hidden>·</span>
              <span>Dòz: {t.dose}</span>
            </>
          )}
          {t.frequency && (
            <>
              <span aria-hidden>·</span>
              <span>{t.frequency}</span>
            </>
          )}
          {t.duration && (
            <>
              <span aria-hidden>·</span>
              <span>{t.duration}</span>
            </>
          )}
        </div>
      </div>
      <RowControls
        treatment={t}
        onEdit={onEdit}
      />
    </li>
  );
}

/* ─── Action buttons (edit / complete / cancel / delete) ──────────────── */

function RowControls({
  treatment,
  onEdit,
}: {
  treatment: Treatment;
  onEdit: () => void;
}) {
  const router = useRouter();
  const status = treatment.status as 'active' | 'completed' | 'cancelled';
  const [pending, setPending] = React.useState<
    'complete' | 'cancel' | 'delete' | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  React.useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 2400);
    return () => clearTimeout(t);
  }, [error]);

  async function onSetStatus(s: 'completed' | 'cancelled') {
    setPending(s === 'completed' ? 'complete' : 'cancel');
    setError(null);
    const res = await setTreatmentStatus(treatment.id, s);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function onDelete() {
    setPending('delete');
    setError(null);
    const res = await deleteTreatment(treatment.id);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirmingDelete(false);
    router.refresh();
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <IconButton
        title="Modifye"
        onClick={onEdit}
        loading={false}
        hoverClass="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
      >
        <Pencil className="w-4 h-4" strokeWidth={2.2} />
      </IconButton>

      {status === 'active' && (
        <>
          <IconButton
            title="Make konplete"
            onClick={() => onSetStatus('completed')}
            loading={pending === 'complete'}
            hoverClass="hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
          </IconButton>
          <IconButton
            title="Anile"
            onClick={() => onSetStatus('cancelled')}
            loading={pending === 'cancel'}
            hoverClass="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
          >
            <XCircle className="w-4 h-4" strokeWidth={2.2} />
          </IconButton>
        </>
      )}

      {!confirmingDelete ? (
        <IconButton
          title="Efase"
          onClick={() => setConfirmingDelete(true)}
          loading={pending === 'delete'}
          hoverClass="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.2} />
        </IconButton>
      ) : (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200">
          <span className="text-[11px] text-rose-700 font-semibold">Sèten?</span>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending === 'delete'}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 disabled:opacity-60 inline-flex items-center gap-1"
          >
            {pending === 'delete' && (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
            )}
            Wi
          </button>
          <span aria-hidden className="text-rose-300">·</span>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            disabled={pending === 'delete'}
            className="text-[11px] font-semibold text-earth-600 hover:text-ink"
          >
            Non
          </button>
        </div>
      )}

      {error && (
        <span className="absolute top-full right-0 mt-1 text-[11px] text-rose-700 whitespace-nowrap bg-rose-50 border border-rose-200 px-2 py-0.5 rounded inline-flex items-center gap-1 z-10">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
          {error}
        </span>
      )}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  loading,
  children,
  hoverClass,
}: {
  title: string;
  onClick: () => void;
  loading: boolean;
  children: React.ReactNode;
  hoverClass: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={loading}
      className={cn(
        'grid place-items-center w-8 h-8 rounded-lg border transition disabled:opacity-60 disabled:cursor-wait',
        'bg-white text-earth-600 border-cream-200',
        hoverClass
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} /> : children}
    </button>
  );
}

/* ─── Edit form (inline) ──────────────────────────────────────────────── */

function EditCard({
  treatment,
  conditions,
  onClose,
}: {
  treatment: Treatment;
  conditions: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const action = updateTreatment.bind(null, treatment.id);
  const [state, formAction] = useFormState<AdminTreatmentState, FormData>(
    action,
    {}
  );
  const [kind, setKind] = React.useState<Kind>(treatment.kind as Kind);

  // Close on success
  React.useEffect(() => {
    if (state.ok) {
      router.refresh();
      const t = setTimeout(() => onClose(), 600);
      return () => clearTimeout(t);
    }
  }, [state.ok, onClose, router]);

  return (
    <li className="rounded-xl border border-amber-300 bg-amber-50/40 p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700">
            <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-sm font-bold text-ink">Modifye tretman</div>
            <div className="text-[11px] text-earth-600">
              Pasyan an pap resevwa yon notifikasyon nouvo pou yon koreksyon —
              sèlman chanjman an aplike.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid place-items-center w-8 h-8 rounded-lg bg-white text-earth-600 border border-cream-200 hover:bg-cream-50 transition"
          aria-label="Fèmen"
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
        </button>
      </header>

      <form action={formAction} className="space-y-3">
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

        <Field label="Tit" required>
          <input
            type="text"
            name="title"
            required
            minLength={2}
            maxLength={200}
            defaultValue={treatment.title}
            className={inputClass}
          />
        </Field>

        <Field label="Deskripsyon / enstriksyon" required>
          <textarea
            name="description"
            required
            rows={4}
            minLength={4}
            maxLength={4000}
            defaultValue={treatment.description}
            className={cn(inputClass, 'leading-relaxed resize-y')}
          />
        </Field>

        {(kind === 'medication' || kind === 'herbal') && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Dòz">
              <input
                type="text"
                name="dose"
                defaultValue={treatment.dose ?? ''}
                className={inputClass}
                placeholder="500 mg"
              />
            </Field>
            <Field label="Frekans">
              <input
                type="text"
                name="frequency"
                defaultValue={treatment.frequency ?? ''}
                className={inputClass}
                placeholder="2 fwa pa jou"
              />
            </Field>
            <Field label="Dire">
              <input
                type="text"
                name="duration"
                defaultValue={treatment.duration ?? ''}
                className={inputClass}
                placeholder="14 jou"
              />
            </Field>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Konekte ak mezi">
            <select
              name="related_metric"
              defaultValue={treatment.related_metric ?? ''}
              className={inputClass}
            >
              {METRIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Konekte ak kondisyon">
            <select
              name="related_condition"
              defaultValue={treatment.related_condition ?? ''}
              className={inputClass}
            >
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
              defaultValue={treatment.start_date ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Dat fini (opsyonèl)">
            <input
              type="date"
              name="end_date"
              defaultValue={treatment.end_date ?? ''}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Nòt entèn (opsyonèl)">
          <textarea
            name="notes"
            rows={2}
            defaultValue={treatment.notes ?? ''}
            className={cn(inputClass, 'resize-y')}
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
            <span>Chanjman anrejistre.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-earth-700 hover:text-ink transition"
          >
            Anile
          </button>
          <SaveButton />
        </div>
      </form>
    </li>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-earth-700">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-xl transition"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
      ) : (
        <Save className="w-3.5 h-3.5" strokeWidth={2.4} />
      )}
      Anrejistre chanjman
    </button>
  );
}
