'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, RotateCcw } from 'lucide-react';
import {
  archiveContactMessage,
  reopenContactMessage,
} from '../actions';
import type { Database } from '@/types/database';

type Status = Database['public']['Tables']['contact_messages']['Row']['status'];

/**
 * Side-rail actions: archive an active message, or re-open an archived
 * one. Both flip status and refresh the page so the inbox list updates.
 */
export default function ContactRowActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function call(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card">
      <h3 className="text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-3">
        Aksyon
      </h3>
      <div className="space-y-2">
        {status === 'archived' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => call(() => reopenContactMessage(id))}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-forest-100 hover:bg-forest-200 disabled:opacity-60 text-forest-800 text-sm font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.4} />
            Reouvri (Nouvo)
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => call(() => archiveContactMessage(id))}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 disabled:opacity-60 text-earth-700 text-sm font-semibold transition"
          >
            <Archive className="w-3.5 h-3.5" strokeWidth={2.4} />
            Achive
          </button>
        )}
      </div>
    </div>
  );
}
