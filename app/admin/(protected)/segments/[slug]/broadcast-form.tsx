'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Send,
  AlertCircle,
  CheckCircle2,
  Users as UsersIcon,
} from 'lucide-react';
import { broadcastToSegment } from './actions';

/**
 * Inline broadcast composer in the segment detail page. Sends a single
 * notification to every user_id currently in this segment — fan-out is
 * implemented as a bulk insert on the server action side so it stays one
 * round trip regardless of segment size.
 */
export default function SegmentBroadcastForm({
  slug,
  label,
  memberIds,
}: {
  slug: string;
  label: string;
  memberIds: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit() {
    setError(null);
    setSuccess(null);
    if (title.trim().length < 3) {
      setError('Tit la twò kout.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Mesaj la twò kout (omwen 10 karaktè).');
      return;
    }
    if (memberIds.length === 0) {
      setError('Pa gen manm nan segman sa.');
      return;
    }

    startTransition(async () => {
      const res = await broadcastToSegment({
        slug,
        title: title.trim(),
        message: message.trim(),
        userIds: memberIds,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(`Notifikasyon voye bay ${res.delivered} manm.`);
      setTitle('');
      setMessage('');
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-1">
          <Bell className="w-3.5 h-3.5" strokeWidth={2.4} />
          Voye notifikasyon
        </div>
        <h3 className="font-display text-lg font-bold text-ink">
          Mesaj pou segman {label}
        </h3>
        <p className="text-[11px] text-earth-600 mt-1 inline-flex items-center gap-1">
          <UsersIcon className="w-3 h-3" strokeWidth={2.4} />
          {memberIds.length} manm ap resevwa mesaj sa
        </p>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800 flex items-start gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-earth-700 mb-1">
            Tit
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Egzanp: Konsèy pou tansyon ou"
            className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 transition"
            disabled={pending}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-earth-700 mb-1">
            Mesaj
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="Sa ou vle pataje ak segman sa..."
            className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 transition resize-y leading-relaxed"
            disabled={pending}
          />
          <div className="text-[10px] text-earth-500 text-right mt-0.5">
            {message.length} / 1000
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={
            pending ||
            title.trim().length < 3 ||
            message.trim().length < 10 ||
            memberIds.length === 0
          }
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 text-sm font-semibold transition"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={2.4} />
          {pending ? 'Voye...' : `Voye bay ${memberIds.length} manm`}
        </button>
      </div>
    </section>
  );
}
