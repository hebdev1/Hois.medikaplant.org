'use client';

import React from 'react';
import Link from 'next/link';
import { Search, GraduationCap, ArrowRight, X } from 'lucide-react';
import { PreorderBadge } from './preorder-notice';

export type BrowserCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  instructor_name: string | null;
  level: string;
  format: string;
  price_cents: number | null;
  duration_text: string | null;
  tags: string[] | null;
  released: boolean;
};

const LEVEL_LABEL: Record<string, string> = {
  tout_nivo: 'Tout nivo',
  debitan: 'Debitan',
  entelijan: 'Entèmedyè',
  entèmedyè: 'Entèmedyè',
  avanse: 'Avanse',
};
const FORMAT_LABEL: Record<string, string> = {
  video: 'Videyo',
  live_zoom: 'Zoom',
  hybrid: 'Hybrid',
  interactive: 'Enteraktif',
};

const labelFor = (map: Record<string, string>, v: string) =>
  map[v] ?? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ');

export default function CourseBrowser({
  courses,
}: {
  courses: BrowserCourse[];
}) {
  const [query, setQuery] = React.useState('');
  const [level, setLevel] = React.useState('all');
  const [format, setFormat] = React.useState('all');
  const [price, setPrice] = React.useState<'all' | 'free' | 'paid'>('all');

  const levels = React.useMemo(
    () => [...new Set(courses.map((c) => c.level).filter(Boolean))],
    [courses]
  );
  const formats = React.useMemo(
    () => [...new Set(courses.map((c) => c.format).filter(Boolean))],
    [courses]
  );

  const q = query.trim().toLowerCase();
  const filtered = courses.filter((c) => {
    if (level !== 'all' && c.level !== level) return false;
    if (format !== 'all' && c.format !== format) return false;
    const isFree = !c.price_cents || c.price_cents <= 0;
    if (price === 'free' && !isFree) return false;
    if (price === 'paid' && isFree) return false;
    if (q) {
      const hay = `${c.title} ${c.description} ${(c.tags ?? []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const hasFilters = level !== 'all' || format !== 'all' || price !== 'all' || q;

  const selectCls =
    'text-sm rounded-full border border-slate-200 bg-white px-3.5 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-brand-200';

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
            strokeWidth={2.2}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chèche yon klas…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={selectCls}
            aria-label="Nivo"
          >
            <option value="all">Tout nivo</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {labelFor(LEVEL_LABEL, l)}
              </option>
            ))}
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className={selectCls}
            aria-label="Fòma"
          >
            <option value="all">Tout fòma</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {labelFor(FORMAT_LABEL, f)}
              </option>
            ))}
          </select>
          <select
            value={price}
            onChange={(e) => setPrice(e.target.value as 'all' | 'free' | 'paid')}
            className={selectCls}
            aria-label="Pri"
          >
            <option value="all">Tout pri</option>
            <option value="free">Gratis</option>
            <option value="paid">Peyan</option>
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setLevel('all');
                setFormat('all');
                setPrice('all');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-ink px-2 py-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.4} />
              Efase
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-ink-muted mb-4">
        {filtered.length} klas{filtered.length === 1 ? '' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
          <GraduationCap
            className="w-10 h-10 mx-auto text-earth-400 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm text-ink-muted">
            Okenn klas pa matche rechèch ou a.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((c) => {
            const isFree = !c.price_cents || c.price_cents <= 0;
            return (
              <Link
                key={c.id}
                href={`/klas/${c.slug}`}
                className="group rounded-2xl bg-white border border-slate-200/70 overflow-hidden hover:border-brand-300 hover:shadow-card transition-all flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-cream-100">
                  {c.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.cover_image_url}
                      alt={c.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-earth-500">
                      <GraduationCap className="w-9 h-9" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {c.released === false && <PreorderBadge />}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-ink">
                      {labelFor(FORMAT_LABEL, c.format)}
                    </span>
                  </div>
                </div>
                <div className="p-4 md:p-5 flex-1 flex flex-col">
                  <h3 className="font-display text-base font-bold text-ink leading-tight line-clamp-2">
                    {c.title}
                  </h3>
                  {c.instructor_name && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Avèk {c.instructor_name}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-ink text-sm">
                      {isFree ? (
                        <span className="text-forest-700">Gratis</span>
                      ) : (
                        `$${(c.price_cents! / 100).toFixed(2)}`
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:gap-1.5 transition-all">
                      Wè detay
                      <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
