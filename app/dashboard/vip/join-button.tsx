'use client';

import React from 'react';
import { Loader2, Crown, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { joinVip } from './actions';

export default function JoinVipButton({ joined }: { joined: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  if (joined) {
    return (
      <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-100 text-forest-800 font-semibold text-sm">
        <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
        Ou enskri nan VIP
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setErr(null);
          setPending(true);
          const res = await joinVip();
          setPending(false);
          if (res.ok) router.refresh();
          else setErr(res.error ?? 'Erè.');
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-400 hover:bg-gold-300 text-forest-900 font-semibold text-sm transition disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Crown className="w-4 h-4" strokeWidth={2.4} />
        )}
        Enskri nan VIP
      </button>
      {err && <p className="text-xs text-rose-700">{err}</p>}
    </div>
  );
}
