'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Clock,
  CalendarCheck,
  CalendarClock,
  Video,
  Phone,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  acceptReschedule,
  declineReschedule,
  cancelConsultation,
} from './actions';
import type { Slot } from './slot-picker';

type Booking = {
  id: string;
  status: 'pending' | 'confirmed' | 'reschedule_proposed' | string;
  topic: string | null;
  note: string | null;
  meeting_url: string | null;
  consultant_name: string | null;
};

const TZ = 'America/Port-au-Prince';

const MODALITY_LABEL: Record<Slot['modality'], string> = {
  video: 'Videyo',
  phone: 'Telefòn',
  in_person: 'An pèsòn',
};

const ModalityIcon = ({ modality }: { modality: Slot['modality'] }) => {
  const cls = 'w-3.5 h-3.5';
  if (modality === 'phone') return <Phone className={cls} strokeWidth={2.4} />;
  if (modality === 'in_person') return <Users className={cls} strokeWidth={2.4} />;
  return <Video className={cls} strokeWidth={2.4} />;
};

const fmtFull = (iso: string) =>
  new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

function SlotLine({ slot }: { slot: Slot }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-semibold text-ink capitalize">
        {fmtFull(slot.starts_at)}
      </span>
      <span className="inline-flex items-center gap-1 text-[11px] text-earth-600 px-1.5 py-0.5 rounded-full bg-cream-100 border border-cream-200">
        <ModalityIcon modality={slot.modality} />
        {MODALITY_LABEL[slot.modality]}
      </span>
      {slot.consultant_name && (
        <span className="text-[12px] text-earth-600">ak {slot.consultant_name}</span>
      )}
    </span>
  );
}

export default function BookingStatusCard({
  booking,
  slot,
  proposedSlot,
}: {
  booking: Booking;
  slot: Slot | null;
  proposedSlot: Slot | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<
    'accept' | 'decline' | 'cancel' | null
  >(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function run(
    kind: 'accept' | 'decline' | 'cancel',
    fn: () => Promise<{ ok: boolean; error?: string }>
  ) {
    if (pending) return;
    if (kind === 'cancel' && !window.confirm('Anile demann konsiltasyon sa a?')) {
      return;
    }
    setPending(kind);
    setErr(null);
    try {
      const res = await fn();
      if (res.ok) router.refresh();
      else {
        setErr(res.error ?? 'Erè enkoni.');
        setPending(null);
      }
    } catch {
      setErr('Yon erè rive. Reeseye.');
      setPending(null);
    }
  }

  const isConfirmed = booking.status === 'confirmed';
  const isReschedule = booking.status === 'reschedule_proposed';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold-200 bg-white shadow-card">
      {/* Premium header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gold-500 to-forest-900 text-cream-50 p-5 md:p-7">
        <div
          className="absolute -top-12 -right-10 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden
        />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-200 font-semibold mb-2">
            <Stethoscope className="w-3 h-3" strokeWidth={2.4} />
            Konsiltasyon patikilye
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold leading-snug">
            {isConfirmed
              ? 'Konsiltasyon ou konfime'
              : isReschedule
                ? 'Nou pwopoze w yon lòt lè'
                : 'Demann ou resevwa'}
          </h2>
          {booking.topic && (
            <p className="mt-2 text-sm text-cream-200/90 leading-relaxed max-w-xl">
              Sijè: {booking.topic}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        {/* PENDING */}
        {booking.status === 'pending' && (
          <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3.5">
            <Clock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-gold-700">
                N ap verifye demann ou.
              </p>
              <p className="text-[13px] text-gold-700 mt-0.5">
                Kreno ou chwazi a:
              </p>
              {slot && (
                <p className="text-[13px] mt-1 text-ink">
                  <SlotLine slot={slot} />
                </p>
              )}
              <p className="text-[12px] text-gold-700/90 mt-1.5">
                N ap konfime l — oswa n ap pwopoze w yon lòt lè.
              </p>
            </div>
          </div>
        )}

        {/* CONFIRMED */}
        {isConfirmed && slot && (
          <div className="flex items-start gap-3 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3.5">
            <CalendarCheck className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-forest-900">
                Randevou w konfime.
              </p>
              <p className="text-[13px] mt-1 text-ink">
                <SlotLine slot={slot} />
              </p>
              {booking.meeting_url && (
                <a
                  href={booking.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-forest-700 hover:bg-forest-800 text-cream-50 text-xs font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Louvri randevou a
                </a>
              )}
            </div>
          </div>
        )}

        {/* RESCHEDULE PROPOSED — member must accept or decline */}
        {isReschedule && (
          <div className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CalendarClock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="min-w-0 space-y-2.5">
                <p className="text-sm font-semibold text-gold-700">
                  Nou pwopoze yon nouvo lè pou konsiltasyon ou.
                </p>
                {slot && (
                  <p className="text-[12px] text-earth-600">
                    Ansyen lè:{' '}
                    <span className="line-through">{fmtFull(slot.starts_at)}</span>
                  </p>
                )}
                {proposedSlot && (
                  <div className="rounded-lg bg-white border border-gold-200 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gold-700 mb-0.5">
                      Nouvo lè pwopoze
                    </p>
                    <p className="text-[13px] text-ink">
                      <SlotLine slot={proposedSlot} />
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => run('accept', () => acceptReschedule(booking.id))}
                    disabled={pending !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-xs font-bold transition"
                  >
                    {pending === 'accept' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
                    ) : (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                    )}
                    Aksepte nouvo lè a
                  </button>
                  <button
                    type="button"
                    onClick={() => run('decline', () => declineReschedule(booking.id))}
                    disabled={pending !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-cream-200 hover:border-earth-300 disabled:opacity-60 text-earth-700 text-xs font-bold transition"
                  >
                    {pending === 'decline' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
                    ) : (
                      <X className="w-3.5 h-3.5" strokeWidth={2.4} />
                    )}
                    Refize, m ap chwazi yon lòt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {booking.note && (
          <p className="text-[12px] text-earth-500 leading-relaxed whitespace-pre-wrap">
            Nòt ou: {booking.note}
          </p>
        )}

        {err && (
          <div className="rounded-xl px-3 py-2 text-xs flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
            <span>{err}</span>
          </div>
        )}

        {/* Cancel — available while pending or confirmed */}
        {(booking.status === 'pending' || isConfirmed) && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => run('cancel', () => cancelConsultation(booking.id))}
              disabled={pending !== null}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-earth-500 hover:text-rose-700 disabled:opacity-60 transition"
            >
              {pending === 'cancel' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
              ) : (
                <X className="w-3.5 h-3.5" strokeWidth={2.4} />
              )}
              Anile demann lan
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
