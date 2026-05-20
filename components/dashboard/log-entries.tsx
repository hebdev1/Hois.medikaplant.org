'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteHealthLog } from '@/app/dashboard/health/actions';
import { cn } from '@/lib/utils';

export type LogEntry = {
  id: string;
  value: number;
  unit: string;
  loggedAt: string;
  zone: 'ok' | 'warn' | 'bad';
  notes?: string | null;
};

type Props = {
  entries: LogEntry[];
  targetMin: number;
  targetMax: number;
};

const ZONE_META: Record<LogEntry['zone'], { label: string; cls: string }> = {
  ok: { label: 'Nòmal', cls: 'bg-forest-100 text-forest-700' },
  warn: { label: 'Atansyon', cls: 'bg-gold-100 text-gold-700' },
  bad: { label: 'Pa nan zòn', cls: 'bg-rose-100 text-rose-700' },
};

const DATE_FMT = new Intl.DateTimeFormat('fr-HT', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Jodi a';
  if (days === 1) return 'Yè';
  if (days < 7) return `${days} jou pase`;
  return DATE_FMT.format(new Date(iso));
}

export default function LogEntries({ entries }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center text-sm text-earth-600">
        Poko gen mezi pou peryòd la — ajoute youn pi wo.
      </div>
    );
  }

  async function onDelete(id: string) {
    setPendingId(id);
    setError(null);
    const res = await deleteHealthLog(id);
    setPendingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirmingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const zoneMeta = ZONE_META[e.zone];
        const isConfirming = confirmingId === e.id;
        const isPending = pendingId === e.id;
        return (
          <div
            key={e.id}
            className="group grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 hover:bg-white hover:border-forest-200 transition"
          >
            <div className="min-w-0">
              <div className="font-semibold text-ink">
                {e.value}
                <span className="text-xs font-normal text-earth-500 ml-1">
                  {e.unit}
                </span>
              </div>
              <div className="text-[11px] text-earth-500">
                {relativeLabel(e.loggedAt)}
                {e.notes && (
                  <>
                    {' · '}
                    <span className="italic">&ldquo;{e.notes.slice(0, 60)}{e.notes.length > 60 ? '…' : ''}&rdquo;</span>
                  </>
                )}
              </div>
            </div>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                zoneMeta.cls
              )}
            >
              {zoneMeta.label}
            </span>
            {isConfirming ? (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDelete(e.id)}
                  disabled={isPending}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 disabled:opacity-60 inline-flex items-center gap-1"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
                  ) : null}
                  Wi
                </button>
                <span aria-hidden className="text-rose-300">·</span>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  disabled={isPending}
                  className="text-[11px] font-semibold text-earth-600 hover:text-ink"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(e.id)}
                title="Efase mezi sa a"
                className="grid place-items-center w-8 h-8 rounded-lg text-earth-500 hover:text-rose-700 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
              </button>
            )}
          </div>
        );
      })}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
