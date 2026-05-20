'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addHealthLog, type Metric } from '@/app/dashboard/health/actions';

type Props = {
  metric: Metric;
};

const PLACEHOLDER: Record<Metric, string> = {
  blood_sugar: 'egz. 118',
  weight: 'egz. 72.4',
  pressure: 'egz. 120/80',
};

const UNIT: Record<Metric, string> = {
  blood_sugar: 'mg/dL',
  weight: 'kg',
  pressure: 'mmHg',
};

const TITLE: Record<Metric, string> = {
  blood_sugar: 'sik nan san',
  weight: 'pwa kò',
  pressure: 'tansyon',
};

export default function LogForm({ metric }: Props) {
  const router = useRouter();
  const [value, setValue] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [showNotes, setShowNotes] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Clear inputs when switching metric
  React.useEffect(() => {
    setValue('');
    setNotes('');
    setError(null);
    setSuccess(false);
    setShowNotes(false);
  }, [metric]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || pending) return;
    setPending(true);
    setError(null);
    setSuccess(false);
    const res = await addHealthLog(metric, value, notes || undefined);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    setValue('');
    setNotes('');
    setShowNotes(false);
    setTimeout(() => setSuccess(false), 2200);
    // Refresh so the chart, entries list, and summary all pick up the new row.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-earth-700 uppercase tracking-wider">
          Mezi {TITLE[metric]} jou a
        </label>
        <div className="mt-1.5 flex gap-2">
          <div className="relative flex-1">
            <input
              type={metric === 'pressure' ? 'text' : 'number'}
              inputMode={metric === 'pressure' ? 'text' : 'decimal'}
              step={metric === 'weight' ? '0.1' : '1'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={PLACEHOLDER[metric]}
              required
              disabled={pending}
              className="w-full pl-4 pr-16 py-3 text-lg font-display font-semibold bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink disabled:opacity-60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-earth-500 pointer-events-none">
              {UNIT[metric]}
            </span>
          </div>
          <button
            type="submit"
            disabled={!value.trim() || pending}
            className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 rounded-xl transition shadow-plant shrink-0"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={2.4} />
            )}
            <span className="hidden sm:inline">Mete jodi a</span>
            <span className="sm:hidden">Anrejistre</span>
          </button>
        </div>
      </div>

      {showNotes ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Yon ti nòt opsyonèl (egz: apre yon sportiv, oswa pa byen)…"
          rows={2}
          maxLength={500}
          disabled={pending}
          className="w-full px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink/90 resize-y disabled:opacity-60"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="text-xs font-semibold text-forest-700 hover:text-forest-800"
        >
          + Ajoute yon nòt
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>Mezi anrejistre.</span>
        </div>
      )}
    </form>
  );
}
