'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sprout, Check, X, MapPin, Loader2, Inbox, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { reviewLabContribution } from './actions';

export type LabContribution = {
  id: string;
  plant_id: string | null;
  local_name: string | null;
  region: string | null;
  body: string | null;
  photo_path: string | null;
  status: 'draft' | 'published' | 'rejected';
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plant: any;
};

const DEPT: Record<string, string> = {
  AR: 'Latibonit', CE: 'Sant', GA: 'Grandans', NI: 'Nip', NO: 'Nò',
  NE: 'Nòdès', NW: 'Nòdwès', OU: 'Lwès', SU: 'Sid', SE: 'Sidès',
};
const FILTERS = ['draft', 'published', 'rejected', 'tout'] as const;
const LABEL: Record<string, string> = { draft: 'Bouyon', published: 'Pibliye', rejected: 'Rejte', tout: 'Tout' };

export default function LabContributionsReview({ initial }: { initial: LabContribution[] }) {
  const [rows, setRows] = React.useState(initial);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>('draft');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState<string | null>(null);

  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const shown = filter === 'tout' ? rows : rows.filter((r) => r.status === filter);

  async function decide(id: string, decision: 'published' | 'rejected') {
    setBusy(id);
    const r = await reviewLabContribution(id, decision);
    setBusy(null);
    if (r.ok) setRows((prev) => prev.map((x) => (x.id === id ? { ...x, status: decision } : x)));
  }
  const plantOf = (c: LabContribution) => (Array.isArray(c.plant) ? c.plant[0] : c.plant) as { name_kr: string; slug: string } | null;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1000px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
          <Sprout className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Kontribisyon Laboratwa
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Kontribisyon <em className="text-forest-600 not-italic font-bold">Laboratwa a</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Non lokal, nòt ak foto moun voye soti nan paj Laboratwa a. Apwouve sa ki bon —
          apre sa ou ka ajoute yo nan dosye plant lan.
        </p>
      </header>

      <nav className="flex items-center gap-1.5 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition',
              filter === f ? 'bg-forest-700 text-cream-50 border-forest-700' : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300')}>
            {LABEL[f]}
            <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-full', filter === f ? 'bg-white/20' : 'bg-cream-100 text-earth-600')}>
              {f === 'tout' ? rows.length : count(f)}
            </span>
          </button>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-2xl shadow-card p-12 text-center">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-cream-100 text-earth-500 mx-auto mb-3">
            <Inbox className="w-5 h-5" strokeWidth={1.8} />
          </span>
          <div className="font-display text-lg font-bold text-ink">Pa gen kontribisyon nan kategori sa a</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {shown.map((c) => {
            const pl = plantOf(c);
            return (
              <article key={c.id} className="bg-white border border-cream-200 rounded-2xl shadow-card p-5 grid md:grid-cols-[1fr_auto] gap-4 items-start">
                <div className="min-w-0">
                  {c.status !== 'draft' && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cream-100 text-earth-600">
                      {LABEL[c.status]}
                    </span>
                  )}
                  <h2 className="font-display text-xl font-bold text-ink mt-1.5 leading-tight">
                    {c.local_name || <span className="text-earth-500 font-normal">(pa gen non lokal)</span>}
                  </h2>
                  {pl && (
                    <Link href={`/laboratwa/plant/${pl.slug}`} target="_blank"
                      className="inline-flex items-center gap-1 text-[13px] text-forest-700 hover:underline mt-0.5">
                      {pl.name_kr} <ExternalLink className="w-3 h-3" strokeWidth={2} />
                    </Link>
                  )}
                  {c.body && <p className="mt-2 text-sm text-earth-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>}
                  {c.region && (
                    <div className="mt-2 flex items-center gap-1.5 text-[13px] text-earth-600">
                      <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                      {DEPT[c.region] ?? c.region}
                    </div>
                  )}
                </div>

                <div className="md:w-[200px] shrink-0">
                  {c.photo_path && (
                    <button onClick={() => setZoom(c.photo_path)} className="block mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.photo_path} alt="" className="w-full max-w-[200px] rounded-lg border border-cream-200" />
                    </button>
                  )}
                  {c.status === 'draft' && (
                    <div className="flex gap-2">
                      <button onClick={() => decide(c.id, 'published')} disabled={busy === c.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded-lg bg-forest-700 text-cream-50 hover:bg-forest-800 disabled:opacity-60 transition">
                        {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.4} />}
                        Apwouve
                      </button>
                      <button onClick={() => decide(c.id, 'rejected')} disabled={busy === c.id}
                        className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-3 rounded-lg border border-cream-300 text-earth-700 hover:bg-cream-50 disabled:opacity-60 transition">
                        <X className="w-4 h-4" strokeWidth={2.4} /> Rejte
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {zoom && (
        <button onClick={() => setZoom(null)} className="fixed inset-0 z-[60] bg-ink/90 flex items-center justify-center p-6" aria-label="Fèmen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-w-full max-h-[85vh] rounded-xl" />
        </button>
      )}
    </div>
  );
}
