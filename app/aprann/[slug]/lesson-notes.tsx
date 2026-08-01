'use client';

import React from 'react';
import { StickyNote, Check, Loader2 } from 'lucide-react';
import { saveLessonNote } from './note-actions';

// Collapsible personal-notes box under a lesson. Autosaves ~1s after the
// student stops typing.
export default function LessonNotes({
  moduleId,
  initialBody,
}: {
  moduleId: string;
  initialBody: string;
}) {
  const [body, setBody] = React.useState(initialBody);
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setBody(next);
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveLessonNote(moduleId, next).catch(() => ({
        ok: false,
      }));
      setStatus(res.ok ? 'saved' : 'idle');
    }, 900);
  }

  const hasNote = body.trim().length > 0;

  return (
    <details
      className="mt-3"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-earth-600 hover:text-ink select-none">
        <StickyNote className="w-3.5 h-3.5" strokeWidth={2.2} />
        Nòt pèsonèl
        {hasNote && !open && (
          <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />
        )}
      </summary>
      <div className="mt-2">
        <textarea
          value={body}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Ekri nòt ou sou leson sa a…"
          className="w-full text-sm rounded-xl border border-cream-200 bg-white px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-forest-200 resize-y"
        />
        <div className="mt-1 h-4 text-[11px] text-earth-500 inline-flex items-center gap-1">
          {status === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
              N ap sove…
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="w-3 h-3 text-forest-600" strokeWidth={2.4} />
              Sove otomatikman
            </>
          )}
        </div>
      </div>
    </details>
  );
}
