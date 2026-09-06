import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, Qty, readLang } from '../lab-ui';
import Filters from './filters';
import { PARTS, PREPS, REGIONS, type PlantRow } from './facets';

export const metadata = {
  title: 'Eksploratè Plant · Laboratwa',
  description:
    'Filtre plant Ayiti yo pa pati moun konn itilize, preparasyon, sezon ak rejyon.',
};
export const dynamic = 'force-dynamic';

const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const csv = (v?: string) =>
  (v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const overlaps = (a: string[] | null, b: string[]) =>
  !!a && b.some((x) => a.includes(x));

export default async function EksploratePage({
  searchParams,
}: {
  searchParams: {
    q?: string; pati?: string; prep?: string; sezon?: string; rejyon?: string; lang?: string;
  };
}) {
  const lang = readLang(searchParams);
  const q = (searchParams.q ?? '').trim();
  const selPati = csv(searchParams.pati);
  const selPrep = csv(searchParams.prep);
  const selSezon = csv(searchParams.sezon).map(Number).filter((n) => n >= 1 && n <= 12);
  const selRejyon = csv(searchParams.rejyon);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants')
    .select(
      'slug, name_kr, name_fr, name_en, name_sci, family, parts_used, preparations, season_months, regions, summary_kr, photos'
    )
    .eq('status', 'published')
    .order('name_kr', { ascending: true });
  const all = (data ?? []) as PlantRow[];

  // Facet counts over the full published set.
  const countBy = (pick: (p: PlantRow) => string[] | null) => {
    const m: Record<string, number> = {};
    for (const p of all) for (const v of pick(p) ?? []) m[v] = (m[v] ?? 0) + 1;
    return m;
  };
  const counts = {
    pati: countBy((p) => p.parts_used),
    prep: countBy((p) => p.preparations),
    rejyon: countBy((p) => p.regions),
    sezon: countBy((p) => (p.season_months ?? []).map(String)),
  };

  // Filter in JS (dataset is small; keeps DB queries simple + exact).
  const nq = norm(q);
  const rezilta = all.filter((p) => {
    if (nq) {
      const hay = norm(`${p.name_kr} ${p.name_fr ?? ''} ${p.name_en ?? ''} ${p.name_sci}`);
      if (!hay.includes(nq)) return false;
    }
    if (selPati.length && !overlaps(p.parts_used, selPati)) return false;
    if (selPrep.length && !overlaps(p.preparations, selPrep)) return false;
    if (selRejyon.length && !overlaps(p.regions, selRejyon)) return false;
    if (selSezon.length && !overlaps((p.season_months ?? []).map(String), selSezon.map(String)))
      return false;
    return true;
  });

  const hasFilters =
    !!q || selPati.length + selPrep.length + selSezon.length + selRejyon.length > 0;
  const partLabel = (v: string) => (PARTS.find((x) => x[0] === v) ?? [v, v])[1];
  const altName = (p: PlantRow) => (lang === 'fr' ? p.name_fr : lang === 'en' ? p.name_en : null);

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />

      <div className="lab-rhead" style={{ marginTop: 20 }}>
        <h1>Eksploratè Plant</h1>
        <div className="lab-rcount" aria-live="polite">
          <Qty>{rezilta.length}</Qty> plant sou <Qty>{all.length}</Qty>
        </div>
      </div>

      <Disclaimer short />

      <div className="lab-explore" style={{ marginTop: 16 }}>
        <Filters
          counts={counts}
          selected={{ pati: selPati, prep: selPrep, rejyon: selRejyon, sezon: selSezon }}
          q={q}
          hasFilters={hasFilters}
          resultCount={rezilta.length}
        />

        <div>
          {rezilta.length === 0 ? (
            <div className="lab-empty">
              Pa gen plant ki koresponn ak filtè yo.
              {hasFilters && (
                <Link href="/laboratwa/eksplorate" className="lab-reset">
                  Retire filtè yo
                </Link>
              )}
            </div>
          ) : (
            <div className="lab-grid">
              {rezilta.map((p) => (
                <Link key={p.slug} href={`/laboratwa/plant/${p.slug}`} className="lab-card">
                  <div className="lab-photo">
                    <span className="lab-nofoto">Pa gen foto ankò</span>
                  </div>
                  <div className="lab-cbody">
                    <div className="lab-cname">{p.name_kr}</div>
                    {altName(p) && (
                      <div className="lab-sci" style={{ fontSize: 12.5 }}>{altName(p)}</div>
                    )}
                    <div className="lab-sci" style={{ fontSize: 12 }}>{p.name_sci}</div>
                    <div className="lab-cparts">
                      {p.parts_used.map(partLabel).join(' · ')}
                    </div>
                    {p.summary_kr && <div className="lab-csum">{p.summary_kr}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
