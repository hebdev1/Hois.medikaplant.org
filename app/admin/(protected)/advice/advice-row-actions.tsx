'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteAdvice } from './actions';
import AdviceComposer from './advice-composer';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type AdviceRow = Database['public']['Tables']['daily_advice']['Row'];

export default function AdviceRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdviceRow | null>(null);
  const [loadingEdit, setLoadingEdit] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onEdit() {
    setLoadingEdit(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchErr } = await supabase
      .from('daily_advice')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setLoadingEdit(false);
    if (fetchErr || !data) {
      setError(fetchErr?.message ?? 'Pa ka chaje konsèy la.');
      return;
    }
    setEditing(data as AdviceRow);
  }

  async function onDelete() {
    setPendingDelete(true);
    setError(null);
    const res = await deleteAdvice(id);
    setPendingDelete(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="w-full mt-3 rounded-xl border border-amber-300 bg-amber-50/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-ink inline-flex items-center gap-1.5">
            <Pencil className="w-4 h-4 text-amber-700" strokeWidth={2.2} />
            Modifye konsèy
          </div>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="grid place-items-center w-8 h-8 rounded-lg bg-white text-earth-600 border border-cream-200 hover:bg-cream-50"
            aria-label="Fèmen"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
        <AdviceComposer
          initial={editing}
          defaultDate={editing.publish_date}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <IconButton
        title="Modifye"
        onClick={onEdit}
        loading={loadingEdit}
        hoverClass="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
      >
        <Pencil className="w-4 h-4" strokeWidth={2.2} />
      </IconButton>

      {!confirming ? (
        <IconButton
          title="Efase"
          onClick={() => setConfirming(true)}
          loading={pendingDelete}
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
            disabled={pendingDelete}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
          >
            {pendingDelete && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />}
            Wi
          </button>
          <span aria-hidden className="text-rose-300">·</span>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pendingDelete}
            className="text-[11px] font-semibold text-earth-600 hover:text-ink"
          >
            Non
          </button>
        </div>
      )}

      {error && (
        <span className="text-[11px] text-rose-700 inline-flex items-center gap-1">
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
