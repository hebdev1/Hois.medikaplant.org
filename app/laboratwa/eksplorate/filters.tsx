'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Check, SlidersHorizontal } from 'lucide-react';
import { PARTS, PREPS, REGIONS, MONTHS, type Facet } from './facets';

type Counts = Record<Facet, Record<string, number>>;
type Selected = { pati: string[]; prep: string[]; rejyon: string[]; sezon: number[] };

export default function Filters({
  counts,
  selected,
  hasFilters,
  resultCount,
}: {
  counts: Counts;
  selected: Selected;
  q: string;
  hasFilters: boolean;
  resultCount: number;
}) {
  const pathname = usePathname() ?? '/laboratwa/eksplorate';
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const activeCount =
    selected.pati.length + selected.prep.length + selected.rejyon.length + selected.sezon.length;

  function toggleHref(facet: Facet, value: string) {
    const p = new URLSearchParams(params?.toString() ?? '');
    const cur = (p.get(facet) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const i = cur.indexOf(value);
    if (i >= 0) cur.splice(i, 1);
    else cur.push(value);
    if (cur.length) p.set(facet, cur.join(','));
    else p.delete(facet);
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }
  const resetHref = (() => {
    const p = new URLSearchParams(params?.toString() ?? '');
    ['pati', 'prep', 'rejyon', 'sezon', 'q'].forEach((k) => p.delete(k));
    const qs = p.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();

  return (
    <>
      {/* Mobile toolbar */}
      <div className="lab-tbar">
        <button type="button" className="lab-tbtn dark" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <SlidersHorizontal size={15} strokeWidth={2} aria-hidden />
          Filtè {activeCount > 0 && <b>{activeCount}</b>}
        </button>
        <span className="lab-rcount" style={{ marginLeft: 'auto' }} aria-hidden>
          {resultCount}
        </span>
      </div>

      <aside className={`lab-side ${open ? 'open' : ''}`} aria-label="Filtè">
        <div className="lab-fgroup">
          <h3>Pati plant lan</h3>
          {PARTS.map(([v, label]) => {
            const on = selected.pati.includes(v);
            return (
              <Link key={v} href={toggleHref('pati', v)} className="lab-check" aria-pressed={on} scroll={false}>
                <span className={`lab-box ${on ? 'on' : ''}`}>{on && <Check strokeWidth={3} aria-hidden />}</span>
                <span>{label}</span>
                <span className="lab-fcount">{counts.pati[v] ?? 0}</span>
              </Link>
            );
          })}
        </div>

        <div className="lab-fgroup">
          <h3>Preparasyon</h3>
          <div className="lab-chips">
            {PREPS.map(([v, label]) => {
              const on = selected.prep.includes(v);
              return (
                <Link key={v} href={toggleHref('prep', v)} className={`lab-chip ${on ? 'on' : ''}`} scroll={false}>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lab-fgroup">
          <h3>Sezon</h3>
          <div className="lab-season">
            {MONTHS.map((label, i) => {
              const m = i + 1;
              const on = selected.sezon.includes(m);
              return (
                <Link key={m} href={toggleHref('sezon', String(m))} className={`lab-scell ${on ? 'on' : ''}`} scroll={false}
                  aria-label={label} aria-pressed={on}>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lab-fgroup">
          <h3>Rejyon</h3>
          {REGIONS.map(([v, label]) => {
            const on = selected.rejyon.includes(v);
            return (
              <Link key={v} href={toggleHref('rejyon', v)} className="lab-check" aria-pressed={on} scroll={false}>
                <span className={`lab-box ${on ? 'on' : ''}`}>{on && <Check strokeWidth={3} aria-hidden />}</span>
                <span>{label}</span>
                <span className="lab-fcount">{counts.rejyon[v] ?? 0}</span>
              </Link>
            );
          })}
        </div>

        {hasFilters && (
          <Link href={resetHref} className="lab-freset" scroll={false}>
            Retire filtè yo
          </Link>
        )}
      </aside>
    </>
  );
}
