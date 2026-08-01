'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2 } from 'lucide-react';
import { markAllNotificationsRead } from './actions';

export default function MarkAllButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (pending || disabled) return;
    setPending(true);
    await markAllNotificationsRead().catch(() => {});
    router.refresh();
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || disabled}
      className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-earth-700 hover:bg-cream-50 disabled:opacity-50 transition"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
      ) : (
        <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.4} />
      )}
      Make tout li
    </button>
  );
}
