'use client';

// Admin editor for "Faz plan an" — the progressive steps a member sees on
// /dashboard/programs. Each phase is a day range + copy; the member's
// fini/aktif/venn state is derived from their current day, so there is no
// status to set here.

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { savePhase, deletePhase, type PhaseState } from './actions';

export type PhaseRow = {
  id: string;
  program_id: string;
  phase_num: number;
  title: string;
  sub: string | null;
  day_start: number;
  day_end: number;
};

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white border border-cream-200 text-sm text-ink placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 transition';

export default function PhasesManager({
  programId,
  phases,
  totalDays,
}: {
  programId: string;
  phases: PhaseRow[];
  totalDays: number | null;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const refresh = React.useCallback(() => {
    setEditingId(null);
    setAdding(false);
    router.refresh();
  }, [router]);

  // Surface gaps/overlaps so the member's timeline stays coherent.
  const sorted = [...phases].sort((a, b) => a.day_start - b.day_start);
  const warnings: string[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev && p.day_start <= prev.day_end) {
      warnings.push(`Faz ${prev.phase_num} ak ${p.phase_num} kouvri menm jou yo.`);
    }
    if (prev && p.day_start > prev.day_end + 1) {
      warnings.push(`Gen yon twou ant jou ${prev.day_end} ak ${p.day_start}.`);
    }
  });
  const last = sorted[sorted.length - 1];
  if (totalDays && last && last.day_end !== totalDays) {
    warnings.push(
      `Dènye faz la fini jou ${last.day_end}, men pwotokòl la gen ${totalDays} jou.`
    );
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-xl bg-forest-100 text-forest-700">
              <CalendarRange className="w-4 h-4" strokeWidth={2.2} />
            </span>
            Faz plan an
          </h2>
          <p className="text-xs text-earth-600 mt-1">
            Etap pwogresif manm nan wè sou tablodebò a
            {totalDays ? ` — pwotokòl la gen ${totalDays} jou.` : '.'}
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            Ajoute yon faz
          </button>
        )}
      </header>

      {warnings.length > 0 && (
        <ul className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 space-y-1">
          {warnings.map((w) => (
            <li
              key={w}
              className="text-[11px] text-amber-800 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2.4} />
              {w}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="mb-4 rounded-xl border border-forest-200 bg-forest-50/40 p-4">
          <PhaseForm
            programId={programId}
            phaseId={null}
            onSaved={refresh}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {sorted.length === 0 && !adding ? (
        <p className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center text-sm text-earth-600">
          Pwotokòl sa a poko gen faz. Ajoute premye a — manm yo ap wè yo sou
          tablodebò yo.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((p) =>
            editingId === p.id ? (
              <li
                key={p.id}
                className="rounded-xl border border-forest-200 bg-forest-50/40 p-4"
              >
                <PhaseForm
                  programId={programId}
                  phaseId={p.id}
                  initial={p}
                  onSaved={refresh}
                  onCancel={() => setEditingId(null)}
                  onDeleted={refresh}
                />
              </li>
            ) : (
              <li
                key={p.id}
                className="rounded-xl border border-cream-200 bg-cream-50/40 p-3 flex items-start gap-3"
              >
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-forest-700 text-cream-50 text-xs font-bold shrink-0">
                  {p.phase_num}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-ink">
                    {p.title}
                    <span className="ml-2 text-[11px] font-normal text-earth-600">
                      Jou {p.day_start}–{p.day_end}
                    </span>
                  </div>
                  {p.sub && (
                    <p className="text-xs text-earth-600 mt-0.5">{p.sub}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.id);
                    setAdding(false);
                  }}
                  className="text-xs font-semibold text-forest-700 hover:text-forest-800 shrink-0"
                >
                  Modifye
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}

function PhaseForm({
  programId,
  phaseId,
  initial,
  onSaved,
  onCancel,
  onDeleted,
}: {
  programId: string;
  phaseId: string | null;
  initial?: PhaseRow;
  onSaved: () => void;
  onCancel: () => void;
  onDeleted?: () => void;
}) {
  const action = savePhase.bind(null, programId, phaseId);
  const [state, formAction] = useFormState<PhaseState, FormData>(action, {});
  const [deleting, setDeleting] = React.useState(false);

  const lastOk = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (state.ok && state.id !== lastOk.current) {
      lastOk.current = state.id;
      onSaved();
    }
  }, [state.ok, state.id, onSaved]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid sm:grid-cols-[80px_1fr] gap-3">
        <label className="block">
          <span className="block text-[11px] font-semibold text-earth-700 mb-1">
            Nimewo
          </span>
          <input
            type="number"
            name="phase_num"
            min={1}
            defaultValue={initial?.phase_num ?? ''}
            placeholder="auto"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold text-earth-700 mb-1">
            Tit faz la <span className="text-rose-600">*</span>
          </span>
          <input
            name="title"
            required
            defaultValue={initial?.title ?? ''}
            placeholder="Detoksifikasyon"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-[11px] font-semibold text-earth-700 mb-1">
          Ti deskripsyon
        </span>
        <input
          name="sub"
          defaultValue={initial?.sub ?? ''}
          placeholder="Netwaye kò a ak te fèy chak maten"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] font-semibold text-earth-700 mb-1">
            Jou kòmansman <span className="text-rose-600">*</span>
          </span>
          <input
            type="number"
            name="day_start"
            min={1}
            required
            defaultValue={initial?.day_start ?? ''}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold text-earth-700 mb-1">
            Jou fen <span className="text-rose-600">*</span>
          </span>
          <input
            type="number"
            name="day_end"
            min={1}
            required
            defaultValue={initial?.day_end ?? ''}
            className={inputClass}
          />
        </label>
      </div>

      {state.error && (
        <p className="text-xs text-rose-700 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <SubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cream-200 text-earth-700 text-xs font-semibold hover:bg-cream-100 transition"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.4} />
          Anile
        </button>
        {phaseId && onDeleted && (
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              const res = await deletePhase(phaseId, programId);
              setDeleting(false);
              if (res.ok) onDeleted();
            }}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
            ) : (
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            )}
            Siprime
          </button>
        )}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-xs font-semibold transition disabled:opacity-60'
      )}
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
      ) : (
        <Save className="w-3.5 h-3.5" strokeWidth={2.4} />
      )}
      Anrejistre
    </button>
  );
}
