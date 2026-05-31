'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { syncMemberHubspot } from '../actions';

export default function HubspotSyncButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(t);
  }, [error]);

  async function onClick() {
    setPending(true);
    setError(null);
    setDone(false);
    const res = await syncMemberHubspot(userId);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-[11px] text-rose-700 inline-flex items-center gap-1 max-w-[260px]">
          <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2.4} />
          <span className="truncate" title={error}>
            {error}
          </span>
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition border disabled:opacity-60 disabled:cursor-wait',
          done
            ? 'bg-forest-50 text-forest-700 border-forest-200'
            : 'bg-white text-[#ff7a59] border-[#ff7a59]/30 hover:border-[#ff7a59] hover:bg-[#ff7a59]/5'
        )}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
        ) : done ? (
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.4} />
        )}
        {pending
          ? 'Ap sinkronize…'
          : done
            ? 'Sinkronize'
            : 'Sinkronize kounye a'}
      </button>
    </div>
  );
}
