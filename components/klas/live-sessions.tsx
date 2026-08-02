'use client';

import React from 'react';
import { Video, Calendar, Loader2 } from 'lucide-react';
import { getSessionJoinLink } from './session-actions';

export type LiveSession = {
  id: string;
  title: string;
  session_type: 'recurring' | 'single';
  starts_at: string;
  duration_minutes: number;
  schedule_text: string | null;
  status: string;
};

function fmt(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    timeZone: 'America/Port-au-Prince',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

type LinkState = { status: 'loading' | 'ready' | 'error'; joinUrl?: string };

// Enrolled-student view of a course's live Zoom sessions. On mount it resolves
// each visible session's personal join link (registering the student with Zoom
// the first time), then shows an "Antre nan Zoom" button with that link.
export default function LiveSessions({
  sessions,
}: {
  sessions: LiveSession[];
}) {
  const [links, setLinks] = React.useState<Record<string, LinkState>>({});

  const now = Date.now();
  const visible = sessions.filter((s) => {
    if (s.status === 'cancelled') return false;
    if (s.session_type === 'recurring') return true; // series always relevant
    const end = new Date(s.starts_at).getTime() + s.duration_minutes * 60000;
    return end > now; // upcoming or ongoing one-offs
  });

  const visibleIds = visible.map((s) => s.id).join(',');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const s of visible) {
        setLinks((p) => ({ ...p, [s.id]: { status: 'loading' } }));
        const res = await getSessionJoinLink(s.id).catch(
          () => ({ ok: false as const })
        );
        if (cancelled) return;
        setLinks((p) => ({
          ...p,
          [s.id]:
            res.ok && res.joinUrl
              ? { status: 'ready', joinUrl: res.joinUrl }
              : { status: 'error' },
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds]);

  if (visible.length === 0) return null;

  return (
    <div className="rounded-2xl bg-forest-800 text-cream-50 p-5 md:p-6 space-y-4">
      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-300">
        <Video className="w-3.5 h-3.5" strokeWidth={2.4} />
        Sesyon an dirèk
      </div>

      <ul className="space-y-3">
        {visible.map((s) => {
          const link = links[s.id];
          return (
            <li
              key={s.id}
              className="rounded-xl bg-forest-900/40 border border-cream-50/10 p-4"
            >
              <div className="font-semibold">{s.title}</div>
              <p className="text-sm text-cream-200 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                {s.schedule_text || fmt(s.starts_at)}
              </p>

              <div className="mt-3">
                {!link || link.status === 'loading' ? (
                  <span className="inline-flex items-center gap-2 text-sm text-cream-200/80">
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
                    N ap prepare lyen pèsonèl ou…
                  </span>
                ) : link.status === 'ready' && link.joinUrl ? (
                  <a
                    href={link.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-forest-900 font-semibold px-5 py-2.5 rounded-full transition"
                  >
                    <Video className="w-4 h-4" strokeWidth={2.4} />
                    Antre nan Zoom
                  </a>
                ) : (
                  <span className="text-sm text-cream-200/80">
                    Lyen ap disponib byento.
                  </span>
                )}
              </div>

              <p className="mt-2 text-[11px] text-cream-200/60">
                Lyen pèsonèl ou — pa pataje l ak lòt moun.
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
