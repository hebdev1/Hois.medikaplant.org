'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Video,
  Phone,
  Users,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { bookConsultationSlot } from './actions';

export type Slot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  modality: 'video' | 'phone' | 'in_person';
  consultant_name: string | null;
};

const TZ = 'America/Port-au-Prince';

const MODALITY: Record<
  Slot['modality'],
  { label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }
> = {
  video: { label: 'Videyo', icon: Video },
  phone: { label: 'Telefòn', icon: Phone },
  in_person: { label: 'An pèsòn', icon: Users },
};

const dayKey = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD, sortable

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export default function SlotPicker({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [topic, setTopic] = React.useState('');
  const [note, setNote] = React.useState('');
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onBook(slotId: string) {
    if (pendingId) return;
    setPendingId(slotId);
    setErr(null);
    try {
      const res = await bookConsultationSlot(slotId, {
        topic: topic.trim() || null,
        note: note.trim() || null,
      });
      if (res.ok) {
        router.refresh();
      } else {
        setErr(res.error ?? 'Erè enkoni.');
        setPendingId(null);
      }
    } catch {
      setErr('Yon erè rive. Reeseye.');
      setPendingId(null);
    }
  }

  // Group the open slots by Haiti-local day, days ascending.
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const k = dayKey(s.starts_at);
    const arr = byDay.get(k);
    if (arr) arr.push(s);
    else byDay.set(k, [s]);
  }
  const days = Array.from(byDay.keys()).sort();

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-forest-700 font-semibold mb-1.5">
          <CalendarDays className="w-3 h-3" strokeWidth={2.4} />
          Kalandriye kreno yo
        </div>
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          Chwazi yon dat ak yon lè
        </h2>
        <p className="mt-1 text-sm text-earth-600 max-w-xl leading-relaxed">
          Chwazi kreno ki bon pou ou. N ap verifye epi konfime l — oswa n ap
          pwopoze w yon lòt lè si sa nesesè.
        </p>
      </header>

      {/* Optional context the member can attach to the booking */}
      <div className="grid gap-3 mb-5">
        <div>
          <label
            htmlFor="k-topic"
            className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1.5 block"
          >
            Sou ki sa ou vle pale?{' '}
            <span className="text-earth-400 font-normal normal-case">
              (opsyonèl)
            </span>
          </label>
          <input
            id="k-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
            placeholder="Egz. yon kondisyon, yon kesyon sou yon plant…"
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink"
          />
        </div>
        <div>
          <label
            htmlFor="k-note"
            className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1.5 block"
          >
            Yon nòt anplis{' '}
            <span className="text-earth-400 font-normal normal-case">
              (opsyonèl)
            </span>
          </label>
          <textarea
            id="k-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Nenpòt detay ou vle pataje davans…"
            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink resize-y"
          />
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-xl px-3 py-2 text-xs flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{err}</span>
        </div>
      )}

      {days.length === 0 ? (
        <p className="text-sm text-earth-500 rounded-xl bg-cream-50 border border-dashed border-cream-200 p-6 text-center">
          Poko gen kreno disponib — n ap pibliye lè yo byento.
        </p>
      ) : (
        <div className="space-y-5">
          {days.map((k) => {
            const daySlots = byDay
              .get(k)!
              .slice()
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
            return (
              <div key={k}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-earth-500 mb-2 capitalize">
                  {fmtDay(daySlots[0].starts_at)}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {daySlots.map((s) => {
                    const m = MODALITY[s.modality];
                    const Icon = m.icon;
                    const isPending = pendingId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onBook(s.id)}
                        disabled={pendingId !== null}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-left transition hover:border-forest-300 hover:bg-white disabled:opacity-60"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold text-ink text-sm">
                            <Clock className="w-3.5 h-3.5 text-forest-700" strokeWidth={2.4} />
                            {fmtTime(s.starts_at)}
                            <span className="text-earth-400 font-normal">
                              · {s.duration_minutes} min
                            </span>
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-earth-600">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border border-cream-200">
                              <Icon className="w-3 h-3" strokeWidth={2.4} />
                              {m.label}
                            </span>
                            {s.consultant_name && <span>ak {s.consultant_name}</span>}
                          </span>
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1 text-[12px] font-bold text-forest-700 group-hover:text-forest-800">
                          {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
                          ) : (
                            <Check className="w-4 h-4" strokeWidth={2.4} />
                          )}
                          Chwazi
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
