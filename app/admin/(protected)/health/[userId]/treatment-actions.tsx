'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setTreatmentStatus, deleteTreatment } from '../actions';

export default function TreatmentActions({
  treatmentId,
  status,
}: {
  treatmentId: string;
  status: 'active' | 'completed' | 'cancelled';
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<'complete' | 'cancel' | 'delete' | null>(null);
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
    const res = await setTreatmentStatus(treatmentId, s);
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
    const res = await deleteTreatment(treatmentId);
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
