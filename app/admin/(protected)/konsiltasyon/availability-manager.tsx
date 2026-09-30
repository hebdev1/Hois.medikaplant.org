'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import {
  CalendarPlus,
  Trash2,
  Loader2,
  Plus,
  Video,
  Phone,
  Users,
} from 'lucide-react';
import { createSlot, deleteSlot, type SlotFormState } from './actions';

type SlotRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  modality: 'video' | 'phone' | 'in_person';
  consultant_name: string | null;
  status: 'open' | 'booked' | 'blocked' | string;
};

const TZ = 'America/Port-au-Prince';

const MODALITY_LABEL: Record<string, string> = {
  video: 'Videyo',
  phone: 'Telefòn',
  in_person: 'An pèsòn',
};

const STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: 'Disponib', tone: 'bg-forest-100 text-forest-800' },
  booked: { label: 'Rezève', tone: 'bg-gold-100 text-gold-700' },
  blocked: { label: 'Fèmen', tone: 'bg-slate-200 text-slate-700' },
};

function fmtDay(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
const dayKey = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 text-ink';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold px-5 py-2.5 rounded-xl transition"
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
      ) : (
        <Plus className="w-4 h-4" strokeWidth={2.4} />
      )}
      Pibliye kreno a
    </button>
  );
}

export default function AvailabilityManager({ slots }: { slots: SlotRow[] }) {
  const router = useRouter();
  const [state, formAction] = useFormState<SlotFormState, FormData>(createSlot, {});
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);

  async function onDelete(id: string) {
    if (deleting) return;
    if (!window.confirm('Efase kreno sa a?')) return;
    setDeleting(id);
    const res = await deleteSlot(id).catch(() => ({ ok: false as const }));
    setDeleting(null);
    if (res.ok) router.refresh();
    else if ('error' in res && res.error) window.alert(res.error);
  }

  // Group upcoming slots by Haiti-local day.
  const byDay = new Map<string, SlotRow[]>();
  for (const s of slots) {
    const k = dayKey(s.starts_at);
    const arr = byDay.get(k);
    if (arr) arr.push(s);
    else byDay.set(k, [s]);
  }
  const days = Array.from(byDay.keys()).sort();

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card">
      <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wide flex items-center gap-2 mb-1">
        <CalendarPlus className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        Kreno disponib
      </h2>
      <p className="text-[11px] text-earth-500 mb-4 leading-snug">
        Pibliye lè ki lib yo. Manm Melis yo ap chwazi youn ladan yo epi w ap
        konfime oswa repwograme li.
      </p>

      {/* Existing slots */}
      {days.length > 0 ? (
        <div className="space-y-4 mb-5">
          {days.map((k) => {
            const daySlots = byDay
              .get(k)!
              .slice()
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
            return (
              <div key={k}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mb-1.5 capitalize">
                  {fmtDay(daySlots[0].starts_at)}
                </h3>
                <ul className="space-y-1.5">
                  {daySlots.map((s) => {
                    const st = STATUS[s.status] ?? {
                      label: s.status,
                      tone: 'bg-cream-100 text-earth-700',
                    };
                    return (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2"
                      >
                        <div className="min-w-0 text-sm">
                          <span className="font-semibold text-ink">
                            {fmtTime(s.starts_at)}
                          </span>
                          <span className="text-earth-400">
                            {' '}
                            · {s.duration_minutes} min ·{' '}
                            {MODALITY_LABEL[s.modality] ?? s.modality}
                          </span>
                          {s.consultant_name && (
                            <span className="text-earth-500">
                              {' '}
                              · {s.consultant_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.tone}`}
                          >
                            {st.label}
                          </span>
                          {s.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => onDelete(s.id)}
                              disabled={deleting === s.id}
                              title="Efase kreno a"
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
                            >
                              {deleting === s.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.4} />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                              )}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-earth-500 rounded-xl bg-cream-50 border border-dashed border-cream-200 p-4 text-center mb-5">
          Poko gen kreno. Ajoute youn anba a.
        </p>
      )}

      {/* Add-slot form */}
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 border-t border-cream-200 pt-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-earth-700">Dat (Ayiti)</label>
            <input type="date" name="date" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-700">Lè (Ayiti)</label>
            <input type="time" name="time" required className={`${inputClass} mt-1`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-earth-700">Dire (min)</label>
            <input
              type="number"
              name="duration"
              min={10}
              max={240}
              defaultValue={30}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-700">Fòma</label>
            <select name="modality" defaultValue="video" className={`${inputClass} mt-1`}>
              <option value="video">Videyo</option>
              <option value="phone">Telefòn</option>
              <option value="in_person">An pèsòn</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-earth-700">
            Non gid la (opsyonèl)
          </label>
          <input
            name="consultant"
            className={`${inputClass} mt-1`}
            placeholder="Egz. Vye Ewòl"
          />
        </div>

        {/* modality hint icons (decorative) */}
        <div className="flex items-center gap-3 text-[11px] text-earth-400">
          <span className="inline-flex items-center gap-1">
            <Video className="w-3 h-3" strokeWidth={2.4} /> videyo
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3 h-3" strokeWidth={2.4} /> telefòn
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" strokeWidth={2.4} /> an pèsòn
          </span>
        </div>

        {state.error && (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <div>
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}
