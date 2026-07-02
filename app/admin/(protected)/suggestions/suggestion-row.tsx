'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  updateSuggestionStatus,
  updateSuggestionNotes,
  deleteSuggestion,
} from './actions';

const STATUS_LABEL: Record<string, string> = {
  new: 'Nouvo',
  triaged: 'Triaje',
  planned: 'Planifye',
  in_progress: 'Ap fèt',
  done: 'Fèt',
  declined: 'Rejte',
};

const STATUSES = ['new', 'triaged', 'planned', 'in_progress', 'done', 'declined'] as const;
type Status = (typeof STATUSES)[number];

export default function SuggestionRow({
  id,
  status,
  notes,
}: {
  id: string;
  status: string;
  notes: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<
    'status' | 'notes' | 'delete' | null
  >(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [notesText, setNotesText] = React.useState(notes ?? '');
  const [notesDirty, setNotesDirty] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(false);

  async function onStatus(next: Status) {
    if (next === status || pending) return;
    setPending('status');
    try {
      const res = await updateSuggestionStatus(id, next);
      if (res.ok) {
        router.refresh();
      } else {
        window.alert(res.error);
      }
    } finally {
      setPending(null);
    }
  }

  async function onSaveNotes() {
    if (pending || !notesDirty) return;
    setPending('notes');
    try {
      const res = await updateSuggestionNotes(id, notesText);
      if (res.ok) {
        setNotesDirty(false);
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1500);
        router.refresh();
      } else {
        window.alert(res.error);
      }
    } finally {
      setPending(null);
    }
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    if (pending) return;
    setPending('delete');
    try {
      const res = await deleteSuggestion(id);
      if (res.ok) {
        router.refresh();
      } else {
        window.alert(res.error);
      }
    } finally {
      setPending(null);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-cream-100 pt-3 mt-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mr-1">
          Estati
        </span>
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onStatus(s)}
              disabled={pending !== null}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-bold transition disabled:opacity-60',
                active
                  ? 'bg-forest-700 text-cream-50'
                  : 'bg-cream-100 text-earth-700 hover:bg-cream-200'
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
        {pending === 'status' && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-earth-600" strokeWidth={2.4} />
        )}
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1 block">
          Nòt admin (prive)
        </label>
        <textarea
          value={notesText}
          onChange={(e) => {
            setNotesText(e.target.value);
            setNotesDirty(true);
          }}
          rows={2}
          maxLength={4000}
          placeholder="Repons entèn, dat planifye, referans ticket…"
          className="w-full px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink resize-y"
        />
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onSaveNotes}
            disabled={!notesDirty || pending !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
          >
            {pending === 'notes' ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
            ) : (
              <Save className="w-3 h-3" strokeWidth={2.4} />
            )}
            Anrejistre nòt
          </button>
          {savedFlash && (
            <span className="inline-flex items-center gap-1 text-[11px] text-forest-700">
              <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
              Anrejistre
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={pending !== null}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition',
              confirmDelete
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'text-rose-600 hover:bg-rose-50 border border-rose-200'
            )}
          >
            {pending === 'delete' ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
            ) : (
              <Trash2 className="w-3 h-3" strokeWidth={2.4} />
            )}
            {confirmDelete ? 'Konfime efasman' : 'Efase'}
          </button>
        </div>
      </div>
    </div>
  );
}
