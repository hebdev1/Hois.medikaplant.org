'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Video,
  Calendar,
  Trash2,
  Plus,
  Loader2,
  ExternalLink,
  Users,
  Repeat,
  RefreshCw,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  createCourseSession,
  deleteCourseSession,
  syncSessionAttendance,
  type SessionActionState,
} from './session-actions';

type Session = {
  id: string;
  title: string;
  session_type: 'recurring' | 'single';
  starts_at: string;
  duration_minutes: number;
  schedule_text: string | null;
  status: string;
  zoom_start_url: string | null;
  registrants: Array<{ name: string; attended: boolean; minutes: number | null }>;
};

const WEEKDAYS = [
  { code: 1, label: 'Dim' },
  { code: 2, label: 'Len' },
  { code: 3, label: 'Mad' },
  { code: 4, label: 'Mèk' },
  { code: 5, label: 'Jed' },
  { code: 6, label: 'Van' },
  { code: 7, label: 'Sam' },
];

function fmt(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    timeZone: 'America/Port-au-Prince',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

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
      Kreye sesyon an
    </button>
  );
}

export default function SessionsManager({
  courseId,
  initial,
}: {
  courseId: string;
  initial: Session[];
}) {
  const router = useRouter();
  const action = createCourseSession.bind(null, courseId);
  const [state, formAction] = useFormState<SessionActionState, FormData>(
    action,
    {}
  );
  const [type, setType] = React.useState<'single' | 'recurring'>('single');
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setType('single');
      router.refresh();
    }
  }, [state.ok, router]);

  async function onDelete(id: string) {
    if (deleting) return;
    if (!window.confirm('Efase sesyon sa a? Reyinyon Zoom lan ap efase tou.')) {
      return;
    }
    setDeleting(id);
    const res = await deleteCourseSession(id).catch(() => ({
      ok: false as const,
    }));
    setDeleting(null);
    if (res.ok) router.refresh();
  }

  async function onSync(id: string) {
    if (syncing) return;
    setSyncing(id);
    const res = await syncSessionAttendance(id).catch(() => ({
      ok: false as const,
    }));
    setSyncing(null);
    if (res.ok) router.refresh();
    else if ('error' in res && res.error) window.alert(res.error);
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card">
      <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wide flex items-center gap-2 mb-1">
        <Video className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        Sesyon an dirèk (Zoom)
      </h2>
      <p className="text-[11px] text-earth-500 mb-4 leading-snug">
        Chak sesyon kreye yon reyinyon Zoom otomatikman. Chak elèv ki achte a ap
        jwenn pwòp lyen pèsonèl li lè li louvri kou a.
      </p>

      {/* Existing sessions */}
      {initial.length > 0 ? (
        <ul className="space-y-2 mb-5">
          {initial.map((s) => {
            const present = s.registrants.filter((r) => r.attended).length;
            return (
              <li
                key={s.id}
                className="rounded-xl border border-cream-200 bg-cream-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                      {s.session_type === 'recurring' && (
                        <Repeat className="w-3.5 h-3.5 text-forest-600" strokeWidth={2.4} />
                      )}
                      {s.title}
                    </div>
                    <div className="text-xs text-earth-600 mt-0.5">
                      {s.schedule_text || fmt(s.starts_at)} · {s.duration_minutes} min
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-earth-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" strokeWidth={2.4} />
                        {s.registrants.length} enskri · {present} prezan
                      </span>
                      {s.zoom_start_url && (
                        <a
                          href={s.zoom_start_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
                          Louvri kòm animatè
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onSync(s.id)}
                        disabled={syncing === s.id}
                        className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:underline disabled:opacity-50"
                      >
                        {syncing === s.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
                        ) : (
                          <RefreshCw className="w-3 h-3" strokeWidth={2.4} />
                        )}
                        Rafrechi prezans
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    disabled={deleting === s.id}
                    title="Efase sesyon an"
                    className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
                  >
                    {deleting === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
                    ) : (
                      <Trash2 className="w-4 h-4" strokeWidth={2.2} />
                    )}
                  </button>
                </div>

                {s.registrants.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-earth-600 select-none">
                      Lis prezans ({present}/{s.registrants.length})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {s.registrants.map((r, ri) => (
                        <li
                          key={ri}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="inline-flex items-center gap-1.5 text-ink">
                            {r.attended ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" strokeWidth={2.4} />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-earth-300" strokeWidth={2.4} />
                            )}
                            {r.name}
                          </span>
                          <span className="text-earth-500">
                            {r.attended
                              ? r.minutes != null
                                ? `${r.minutes} min`
                                : 'prezan'
                              : 'absán'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-earth-500 rounded-xl bg-cream-50 border border-dashed border-cream-200 p-4 text-center mb-5">
          Poko gen sesyon. Ajoute youn anba a.
        </p>
      )}

      {/* Add-session form */}
      <form ref={formRef} action={formAction} className="grid gap-3 border-t border-cream-200 pt-4">
        <input type="hidden" name="session_type" value={type} />
        <div>
          <label className="text-xs font-semibold text-earth-700">Tit sesyon an</label>
          <input name="title" required className={`${inputClass} mt-1`} placeholder="Egz. Klas an dirèk — Semèn 1" />
        </div>

        <div className="inline-flex p-1 bg-cream-100 rounded-xl border border-cream-200">
          {(['single', 'recurring'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                type === t ? 'bg-white text-forest-800 shadow-sm' : 'text-earth-600'
              }`}
            >
              {t === 'single' ? 'Dat inik' : 'Chak semèn (rekiren)'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-earth-700">
              {type === 'recurring' ? 'Premye dat' : 'Dat'} (Ayiti)
            </label>
            <input type="date" name="date" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-700">Lè (Ayiti)</label>
            <input type="time" name="time" required className={`${inputClass} mt-1`} />
          </div>
        </div>

        {type === 'recurring' && (
          <div className="grid gap-3 rounded-xl bg-cream-50 border border-cream-200 p-3">
            <div>
              <label className="text-xs font-semibold text-earth-700">Jou nan semèn nan</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => (
                  <label
                    key={d.code}
                    className="inline-flex items-center gap-1 text-xs bg-white border border-cream-200 rounded-lg px-2.5 py-1.5 cursor-pointer has-[:checked]:bg-forest-600 has-[:checked]:text-cream-50 has-[:checked]:border-forest-600 transition"
                  >
                    <input type="checkbox" name="weekly_days" value={d.code} className="sr-only" />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-700">Dat fen (opsyonèl)</label>
              <input type="date" name="end_date" className={`${inputClass} mt-1`} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-earth-700">Dire (min)</label>
            <input type="number" name="duration_minutes" min={5} max={600} defaultValue={90} className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-700">Orè an tèks (opsyonèl)</label>
            <input name="schedule_text" className={`${inputClass} mt-1`} placeholder="Chak Madi 7pm · 90 min" />
          </div>
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
