'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Send,
  AlertCircle,
  CheckCircle2,
  Users as UsersIcon,
} from 'lucide-react';
import { createTreatmentForSegment } from './actions';

const KIND_OPTIONS = [
  { value: 'herbal', label: 'Tizan / Plant' },
  { value: 'medication', label: 'Medikaman' },
  { value: 'lifestyle', label: 'Abitid lavi' },
  { value: 'monitoring', label: 'Swivi mezi' },
  { value: 'referral', label: 'Referans' },
];

const inputCls =
  'w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 transition';
const labelCls =
  'block text-[11px] font-bold uppercase tracking-wider text-earth-700 mb-1';

/**
 * Propose one treatment to every member of the segment at once. Same fields as
 * the individual prescription form; the server action fans it out to one
 * treatment_recommendations row per member.
 */
export default function SegmentTreatmentForm({
  slug,
  label,
  memberIds,
}: {
  slug: string;
  label: string;
  memberIds: string[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState('herbal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit =
    title.trim().length >= 2 &&
    description.trim().length >= 4 &&
    memberIds.length > 0;

  function submit() {
    setError(null);
    setSuccess(null);
    if (!canSubmit) {
      setError('Ranpli tit ak deskripsyon (epi segman an dwe gen manm).');
      return;
    }
    startTransition(async () => {
      const res = await createTreatmentForSegment({
        slug,
        userIds: memberIds,
        kind,
        title,
        description,
        dose,
        frequency,
        duration,
        relatedCondition: label,
        startDate,
        endDate,
        notes,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(`Tretman pwopoze pou ${res.created} manm.`);
      setTitle('');
      setDescription('');
      setDose('');
      setFrequency('');
      setDuration('');
      setStartDate('');
      setEndDate('');
      setNotes('');
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card mt-4">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-1">
          <Stethoscope className="w-3.5 h-3.5" strokeWidth={2.4} />
          Tretman an gwo
        </div>
        <h3 className="font-display text-lg font-bold text-ink">
          Pwopoze yon tretman pou tout segman {label}
        </h3>
        <p className="text-[11px] text-earth-600 mt-1 inline-flex items-center gap-1">
          <UsersIcon className="w-3 h-3" strokeWidth={2.4} />
          {memberIds.length} manm ap resevwa menm tretman sa
        </p>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800 flex items-start gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className={labelCls}>Tip</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={pending}
            className={inputCls}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Tit</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Egzanp: Tizan fey korosòl"
            className={inputCls}
            disabled={pending}
          />
        </div>
        <div>
          <label className={labelCls}>Deskripsyon</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ki jan pou pran l, poukisa…"
            className={`${inputCls} resize-y leading-relaxed`}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>Doz</label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="1 tas"
              className={inputCls}
              disabled={pending}
            />
          </div>
          <div>
            <label className={labelCls}>Frekans</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="2 fwa/jou"
              className={inputCls}
              disabled={pending}
            />
          </div>
          <div>
            <label className={labelCls}>Dire</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="14 jou"
              className={inputCls}
              disabled={pending}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Kòmanse</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
              disabled={pending}
            />
          </div>
          <div>
            <label className={labelCls}>Fini</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
              disabled={pending}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Nòt (opsyonèl)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputCls} resize-y`}
            disabled={pending}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !canSubmit}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 text-sm font-semibold transition"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={2.4} />
          {pending ? 'Ap pwopoze…' : `Pwopoze pou ${memberIds.length} manm`}
        </button>
      </div>
    </section>
  );
}
