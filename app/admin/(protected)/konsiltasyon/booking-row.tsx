'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  CalendarClock,
  Save,
  Link2,
  Check,
  X,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateBooking,
  rescheduleBooking,
  setBookingMeeting,
  setBookingStatus,
  updateBookingAdminNote,
} from './actions';

type OpenSlot = {
  id: string;
  starts_at: string;
  modality: 'video' | 'phone' | 'in_person' | string;
};

const TZ = 'America/Port-au-Prince';
const MODALITY_LABEL: Record<string, string> = {
  video: 'Videyo',
  phone: 'Telefòn',
  in_person: 'An pèsòn',
};

function fmtFull(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function BookingRow({
  booking,
  openSlots,
}: {
  booking: {
    id: string;
    status: string;
    meetingUrl: string | null;
    consultantName: string | null;
    adminNote: string | null;
  };
  openSlots: OpenSlot[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [newSlotId, setNewSlotId] = React.useState('');
  const [meetingUrl, setMeetingUrl] = React.useState(booking.meetingUrl ?? '');
  const [consultant, setConsultant] = React.useState(booking.consultantName ?? '');
  const [note, setNote] = React.useState(booking.adminNote ?? '');
  const [noteDirty, setNoteDirty] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState<string | null>(null);

  const st = booking.status;
  const canReschedule = st === 'pending' || st === 'confirmed';
  const canSetMeeting =
    st === 'pending' || st === 'confirmed' || st === 'reschedule_proposed';
  const canClose = st !== 'completed' && st !== 'cancelled' && st !== 'declined';

  async function run(
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    flash?: string
  ) {
    if (pending) return;
    setPending(key);
    try {
      const res = await fn();
      if (res.ok) {
        if (flash) {
          setSavedFlash(flash);
          window.setTimeout(() => setSavedFlash(null), 1500);
        }
        router.refresh();
      } else {
        window.alert(res.error ?? 'Erè enkoni.');
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3 border-t border-cream-100 pt-3 mt-3">
      {/* Primary actions */}
      <div className="flex flex-wrap items-center gap-2">
        {st === 'pending' && (
          <button
            type="button"
            onClick={() =>
              run('validate', () => validateBooking(booking.id), 'Konfime')
            }
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-xs font-bold transition"
          >
            {pending === 'validate' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
            ) : (
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
            )}
            Konfime slot la
          </button>
        )}

        {st === 'reschedule_proposed' && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-gold-700 font-semibold">
            <CalendarClock className="w-3.5 h-3.5" strokeWidth={2.4} />
            Ann atant repons manm nan sou nouvo lè a
          </span>
        )}

        {canClose && (
          <div className="flex items-center gap-1.5">
            {st === 'confirmed' && (
              <button
                type="button"
                onClick={() =>
                  run('completed', () =>
                    setBookingStatus(booking.id, 'completed')
                  )
                }
                disabled={pending !== null}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 disabled:opacity-60 text-earth-700 text-[11px] font-bold transition"
              >
                {pending === 'completed' ? (
                  <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
                ) : (
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
                )}
                Fèt
              </button>
            )}
            {st === 'confirmed' && (
              <button
                type="button"
                onClick={() =>
                  run('no_show', () => setBookingStatus(booking.id, 'no_show'))
                }
                disabled={pending !== null}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 disabled:opacity-60 text-earth-700 text-[11px] font-bold transition"
              >
                <UserX className="w-3 h-3" strokeWidth={2.4} />
                Pa vini
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                run('cancelled', () => setBookingStatus(booking.id, 'cancelled'))
              }
              disabled={pending !== null}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 disabled:opacity-60 text-[11px] font-bold transition"
            >
              <X className="w-3 h-3" strokeWidth={2.4} />
              Anile
            </button>
          </div>
        )}

        {savedFlash && (
          <span className="inline-flex items-center gap-1 text-[11px] text-forest-700">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
            {savedFlash}
          </span>
        )}
      </div>

      {/* Reschedule to a different open slot */}
      {canReschedule && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1 block">
              Repwograme sou yon lòt kreno
            </label>
            <select
              value={newSlotId}
              onChange={(e) => setNewSlotId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 text-ink"
            >
              <option value="">— Chwazi yon kreno lib —</option>
              {openSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {fmtFull(s.starts_at)} · {MODALITY_LABEL[s.modality] ?? s.modality}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() =>
              run('reschedule', () => rescheduleBooking(booking.id, newSlotId))
            }
            disabled={pending !== null || !newSlotId}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-400 hover:bg-gold-300 disabled:opacity-60 text-forest-900 text-xs font-bold transition"
          >
            {pending === 'reschedule' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
            ) : (
              <CalendarClock className="w-3.5 h-3.5" strokeWidth={2.4} />
            )}
            Pwopoze
          </button>
        </div>
      )}

      {/* Meeting link + consultant */}
      {canSetMeeting && (
        <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1 block">
                Lyen randevou
              </label>
              <input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 text-ink"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1 block">
                Gid
              </label>
              <input
                value={consultant}
                onChange={(e) => setConsultant(e.target.value)}
                placeholder="Non gid la"
                className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 text-ink"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              run(
                'meeting',
                () => setBookingMeeting(booking.id, meetingUrl, consultant),
                'Anrejistre'
              )
            }
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 text-xs font-bold transition"
          >
            {pending === 'meeting' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
            ) : (
              <Link2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            )}
            Anrejistre lyen
          </button>
        </div>
      )}

      {/* Private admin note */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-earth-600 mb-1 block">
          Nòt admin (prive)
        </label>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteDirty(true);
          }}
          rows={2}
          maxLength={4000}
          placeholder="Nòt entèn sou demann sa a…"
          className="w-full px-3 py-2 text-sm bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 text-ink resize-y"
        />
        <button
          type="button"
          onClick={() =>
            run(
              'note',
              () => updateBookingAdminNote(booking.id, note),
              'Anrejistre'
            ).then(() => setNoteDirty(false))
          }
          disabled={!noteDirty || pending !== null}
          className={cn(
            'mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition',
            'bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50'
          )}
        >
          {pending === 'note' ? (
            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
          ) : (
            <Save className="w-3 h-3" strokeWidth={2.4} />
          )}
          Anrejistre nòt
        </button>
      </div>
    </div>
  );
}
