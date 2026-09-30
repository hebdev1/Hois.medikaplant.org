'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Loader2,
  Send,
  AlertCircle,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import { requestVyeEwolSession } from './actions';

type VipRequest = {
  status: 'nouvo' | 'pwograme' | 'fèt' | 'refize';
  createdAt: string;
} | null;

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-HT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function VipSessionCard({ request }: { request: VipRequest }) {
  const router = useRouter();
  const [topic, setTopic] = React.useState('');
  const [preferredWindow, setPreferredWindow] = React.useState('');
  const [note, setNote] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const hasOpen =
    request && (request.status === 'nouvo' || request.status === 'pwograme');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (topic.trim().length < 5) {
      setErr('Ekri sijè sesyon an (omwen 5 karaktè).');
      return;
    }
    setPending(true);
    setErr(null);
    try {
      const res = await requestVyeEwolSession({
        topic: topic.trim(),
        preferredWindow: preferredWindow.trim() || null,
        note: note.trim() || null,
      });
      if (res.ok) {
        setTopic('');
        setPreferredWindow('');
        setNote('');
        router.refresh();
      } else {
        setErr(res.error ?? 'Erè enkoni.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold-200 bg-white shadow-card">
      {/* Premium gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-5 md:p-7">
        <div
          className="absolute -top-12 -right-10 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden
        />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-200 font-semibold mb-2">
            <Crown className="w-3 h-3" strokeWidth={2.4} />
            Sesyon prive Melis
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold leading-snug">
            Yon konvèsasyon{' '}
            <em className="text-gold-200 not-italic font-bold">
              21 min ak Vye Ewòl
            </em>
          </h2>
          <p className="mt-2 text-sm text-cream-200/90 leading-relaxed max-w-xl">
            Youn nan avantaj ki pi rezève nan Melis: yon echanj konfidansyèl,
            dirèk ak Vye Ewòl. Mande sesyon ou epi n ap kontakte w pou pwograme
            li.
          </p>
        </div>
      </div>

      {/* Body: open-request status, or the request form */}
      <div className="p-5 md:p-6">
        {hasOpen ? (
          <StatusBanner
            status={request!.status as 'nouvo' | 'pwograme'}
            createdAt={request!.createdAt}
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {request &&
              (request.status === 'fèt' || request.status === 'refize') && (
                <p className="text-[11px] text-earth-500 inline-flex items-center gap-1.5">
                  <CalendarCheck className="w-3 h-3" strokeWidth={2.2} />
                  Dènye demann:{' '}
                  {request.status === 'fèt' ? 'sesyon fèt' : 'pa t fèt'} ·{' '}
                  {fmt(request.createdAt)}
                </p>
              )}

            <div>
              <label
                htmlFor="vip-topic"
                className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1.5 block"
              >
                Sou ki sa ou vle pale?
              </label>
              <input
                id="vip-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
                placeholder="Egz. yon kondisyon, yon rèv, yon chemen espirityèl…"
                className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="vip-window"
                className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1.5 block"
              >
                Kilè ki pi bon pou ou?{' '}
                <span className="text-earth-400 font-normal normal-case">
                  (opsyonèl)
                </span>
              </label>
              <input
                id="vip-window"
                value={preferredWindow}
                onChange={(e) => setPreferredWindow(e.target.value)}
                maxLength={500}
                placeholder="Egz. semèn sa a nan aswè, oswa nan wikenn"
                className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="vip-note"
                className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1.5 block"
              >
                Yon nòt anplis{' '}
                <span className="text-earth-400 font-normal normal-case">
                  (opsyonèl)
                </span>
              </label>
              <textarea
                id="vip-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Nenpòt detay ou vle Vye Ewòl konnen davans…"
                className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink resize-y"
              />
            </div>

            {err && (
              <div className="rounded-xl px-3 py-2 text-xs flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800">
                <AlertCircle
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  strokeWidth={2.4}
                />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending || topic.trim().length < 5}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-400 hover:bg-gold-300 disabled:opacity-60 text-forest-900 font-bold text-sm shadow-sm transition"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
              ) : (
                <Send className="w-4 h-4" strokeWidth={2.4} />
              )}
              Mande sesyon mwen
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function StatusBanner({
  status,
  createdAt,
}: {
  status: 'nouvo' | 'pwograme';
  createdAt: string;
}) {
  if (status === 'pwograme') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3.5">
        <CalendarCheck
          className="w-5 h-5 text-forest-700 shrink-0 mt-0.5"
          strokeWidth={2}
        />
        <div>
          <p className="text-sm font-semibold text-forest-900">
            Sesyon ou pwograme.
          </p>
          <p className="text-[13px] text-forest-800 mt-0.5">
            N ap kontakte w ak detay yo. Demann fèt {fmt(createdAt)}.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3.5">
      <Clock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" strokeWidth={2} />
      <div>
        <p className="text-sm font-semibold text-gold-700">
          Demann ou resevwa.
        </p>
        <p className="text-[13px] text-gold-700 mt-0.5">
          Vye Ewòl ap kontakte w pou pwograme sesyon 21 min lan. Demann fèt{' '}
          {fmt(createdAt)}.
        </p>
      </div>
    </div>
  );
}
