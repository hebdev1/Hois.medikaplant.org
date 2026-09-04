'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sprout, Check, X, MapPin, User, HelpCircle, Loader2, Inbox, ArrowLeft, Images,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reviewContribution } from './actions';

export type Contribution = {
  id: string;
  plant_id: string | null;
  plant_not_in_list: string | null;
  plant_name: string;
  plant_scientific: string | null;
  kind: 'lot-non' | 'diferan' | 'koreksyon';
  proposed_name: string | null;
  note: string | null;
  department_code: string | null;
  commune: string | null;
  locality: string | null;
  knowledge_source: string | null;
  photo_confirmation: string | null;
  photos: string[];
  contributor_name: string | null;
  contributor_contact: string | null;
  allow_cite: boolean;
  status: 'nouvo' | 'apwouve' | 'rejte';
  created_at: string;
  reviewed_at: string | null;
};

const DEPT: Record<string, string> = {
  AR: 'Latibonit', CE: 'Sant', GA: 'Grandans', NI: 'Nip', NO: 'Nò',
  NE: 'Nòdès', NW: 'Nòdwès', OU: 'Lwès', SU: 'Sid', SE: 'Sidès',
};
const SOURCE: Record<string, string> = {
  'mwen-menm': 'Se konsa li rele l', fanmi: 'Se konsa fanmi l rele l',
  tande: 'Li tande moun rele l konsa', pratikan: 'Doktè fèy / machann fèy',
};
const CONFIRM: Record<string, string> = {
  wi: 'Wi, se plant sa a', non: 'Non, se pa sa', 'pa-si': 'Pa fin sèten',
};
const KIND: Record<Contribution['kind'], { label: string; cls: string }> = {
  'lot-non': { label: 'Lòt non', cls: 'bg-forest-100 text-forest-700 border-forest-200' },
  diferan: { label: 'Diferan lakay li', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  koreksyon: { label: 'Koreksyon', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
};
const binom = (n: string) => (n ? n.split(/\s+/).slice(0, 2).join(' ') : '');

type RefPhoto = { url: string; att: string; lis: string };
async function chècheReferans(sci: string): Promise<RefPhoto[]> {
  const q = binom(sci);
  if (!q) return [];
  const r = await fetch(
    'https://api.inaturalist.org/v1/taxa?q=' + encodeURIComponent(q) + '&rank=species&per_page=1'
  );
  if (!r.ok) throw new Error('x');
  const j = await r.json();
  const t = (j.results || [])[0];
  if (!t) return [];
  return (t.taxon_photos || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((tp: any) => tp.photo)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p && p.license_code)
    .slice(0, 4)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      url: (p.medium_url || p.url || '').replace('square', 'medium'),
      att: p.attribution || '',
      lis: (p.license_code || '').toUpperCase(),
    }));
}

const FILTERS = ['nouvo', 'apwouve', 'rejte', 'tout'] as const;
type Filter = (typeof FILTERS)[number];

export default function ContributionsReview({ initial }: { initial: Contribution[] }) {
  const [rows, setRows] = React.useState(initial);
  const [filter, setFilter] = React.useState<Filter>('nouvo');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const shown = filter === 'tout' ? rows : rows.filter((r) => r.status === filter);

  async function decide(id: string, decision: 'apwouve' | 'rejte') {
    setBusy(id);
    const res = await reviewContribution(id, decision);
    setBusy(null);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision } : r)));
    }
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1180px] mx-auto">
      <Link
        href="/admin/glose"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-600 hover:text-forest-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Glosè plant
      </Link>
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
          <Sprout className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Kontribisyon glosè
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Kontribisyon <em className="text-forest-600 not-italic font-bold">kominote a</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Non plant, foto, ak koreksyon moun voye soti nan paj glosè a. Apwouve
          sa ki bon; apre sa ou ka ajoute yo nan glosè a ak zouti CRUD la.
        </p>
      </header>

      <nav className="flex items-center gap-1.5 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition',
              filter === f
                ? 'bg-forest-700 text-cream-50 border-forest-700'
                : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300'
            )}
          >
            {f === 'tout' ? 'Tout' : f[0].toUpperCase() + f.slice(1)}
            <span
              className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                filter === f ? 'bg-white/20' : 'bg-cream-100 text-earth-600'
              )}
            >
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
          <div className="font-display text-lg font-bold text-ink">
            Pa gen kontribisyon nan kategori sa a
          </div>
          <p className="text-sm text-earth-600 mt-1.5">
            Lè yon moun voye youn soti nan paj glosè a, l ap parèt isit la.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {shown.map((c) => (
            <Card
              key={c.id}
              c={c}
              busy={busy === c.id}
              onDecide={decide}
              onZoom={setLightbox}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <button
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] bg-ink/90 flex items-center justify-center p-6"
          aria-label="Fèmen"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-xl" />
        </button>
      )}
    </div>
  );
}

function Card({
  c, busy, onDecide, onZoom,
}: {
  c: Contribution;
  busy: boolean;
  onDecide: (id: string, d: 'apwouve' | 'rejte') => void;
  onZoom: (url: string) => void;
}) {
  const [ref, setRef] = React.useState<{ loading: boolean; photos: RefPhoto[]; done: boolean }>(
    { loading: false, photos: [], done: false }
  );
  const kind = KIND[c.kind];

  async function compare() {
    if (!c.plant_scientific) return;
    setRef({ loading: true, photos: [], done: false });
    try {
      const photos = await chècheReferans(c.plant_scientific);
      setRef({ loading: false, photos, done: true });
    } catch {
      setRef({ loading: false, photos: [], done: true });
    }
  }

  return (
    <article className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
      <div className="p-5 grid md:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border', kind.cls)}>
              {kind.label}
            </span>
            {c.status !== 'nouvo' && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cream-100 text-earth-600">
                {c.status}
              </span>
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-ink mt-2 leading-tight">
            {c.plant_name}
          </h2>
          {c.plant_scientific && (
            <div className="text-sm text-earth-600 italic">{c.plant_scientific}</div>
          )}
          <div className="text-[11px] text-earth-500 mt-0.5">
            {c.plant_not_in_list ? 'pa nan glosè a' : c.plant_id}
          </div>

          {c.proposed_name && (
            <div className="mt-3">
              <span className="text-[11px] uppercase tracking-wide font-bold text-earth-500">
                {c.kind === 'koreksyon' ? 'Koreksyon' : 'Non pwopoze'}
              </span>
              <div className="text-base font-semibold text-forest-800">{c.proposed_name}</div>
            </div>
          )}
          {c.note && <p className="mt-2 text-sm text-earth-700 leading-relaxed">{c.note}</p>}

          <div className="mt-3 flex flex-col gap-1 text-[13px] text-earth-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>
                {DEPT[c.department_code ?? ''] ?? '—'}
                {c.commune ? `, ${c.commune}` : ''}
                {c.locality ? `, ${c.locality}` : ''}
              </span>
            </div>
            {c.knowledge_source && (
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span>{SOURCE[c.knowledge_source] ?? c.knowledge_source}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>
                {c.contributor_name || 'Anonim'}
                {c.contributor_contact ? ` · ${c.contributor_contact}` : ''}
                {' · '}
                <span className={c.allow_cite ? 'text-forest-700' : 'text-earth-500'}>
                  {c.allow_cite ? 'mèt site l' : 'pa vle yo site l'}
                </span>
              </span>
            </div>
            {c.photo_confirmation && (
              <div className="text-earth-500">
                Sou referans lan: <b className="text-earth-700">{CONFIRM[c.photo_confirmation]}</b>
              </div>
            )}
          </div>
        </div>

        {/* Photos + actions */}
        <div className="md:w-[280px] shrink-0">
          {c.photos.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {c.photos.map((p, i) => (
                <button key={i} onClick={() => onZoom(p)} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p}
                    alt={`foto ${i + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-cream-200 hover:border-forest-400 transition"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-earth-400 italic">pa gen foto</div>
          )}

          {c.plant_scientific && (
            <div className="mt-3">
              <button
                onClick={compare}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-forest-700 border border-cream-200 rounded-lg px-2.5 py-1.5 hover:bg-cream-50"
              >
                {ref.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
                ) : (
                  <Images className="w-3.5 h-3.5" strokeWidth={2} />
                )}
                Konpare ak referans
              </button>
              {ref.done && (
                <div className="mt-2">
                  {ref.photos.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {ref.photos.map((f, i) => (
                        <button key={i} onClick={() => onZoom(f.url)} title={f.att}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.url} alt="" className="w-14 h-14 object-cover rounded-lg border border-cream-200" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-earth-400 italic">pa gen foto ak lisans lib</div>
                  )}
                </div>
              )}
            </div>
          )}

          {c.status === 'nouvo' && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onDecide(c.id, 'apwouve')}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded-lg bg-forest-700 text-cream-50 hover:bg-forest-800 disabled:opacity-60 transition"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.4} />}
                Apwouve
              </button>
              <button
                onClick={() => onDecide(c.id, 'rejte')}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-3 rounded-lg border border-cream-300 text-earth-700 hover:bg-cream-50 disabled:opacity-60 transition"
              >
                <X className="w-4 h-4" strokeWidth={2.4} /> Rejte
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
