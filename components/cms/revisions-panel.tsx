'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { History, Loader2, X, RotateCcw } from 'lucide-react';
import { listRevisions, restoreRevision, type Revision } from '@/lib/cms/revisions';

export function RevisionsPanel({
  contentType,
  contentId,
}: {
  contentType: 'page' | 'article';
  contentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [revs, setRevs] = React.useState<Revision[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function openPanel() {
    setOpen(true);
    setLoading(true);
    const list = await listRevisions(contentType, contentId);
    setRevs(list);
    setLoading(false);
  }

  async function restore(id: string) {
    setBusyId(id);
    const res = await restoreRevision(id);
    setBusyId(null);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cream-300 bg-white text-earth-700 text-sm font-semibold hover:border-forest-300 hover:text-forest-800 transition"
      >
        <History className="w-4 h-4" strokeWidth={2.2} />
        Istwa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fèmen"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <History className="w-4 h-4 text-earth-500" strokeWidth={2.2} />
                Istwa vèsyon yo
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fèmen" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700">
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-earth-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Ap chaje…
                </div>
              ) : !revs || revs.length === 0 ? (
                <p className="text-sm text-earth-500 italic py-6 text-center">
                  Poko gen vèsyon anrejistre. Chak fwa w Anrejistre, l ap kreye youn.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {revs.map((r, i) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-cream-200 hover:border-forest-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">
                          {r.title || 'San tit'}
                          {i === 0 && (
                            <span className="ml-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700">
                              Kounye a
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-earth-500">
                          {fmt(r.created_at)}
                          {r.actor_email ? ` · ${r.actor_email}` : ''}
                        </div>
                      </div>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => restore(r.id)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition shrink-0 disabled:opacity-50"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.2} />
                          )}
                          Restore
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
