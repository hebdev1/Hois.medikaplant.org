import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, readLang } from '../lab-ui';
import { PARTS, PREPS, MONTHS } from '../eksplorate/facets';
import ComparePicker from './compare-picker';

export const metadata = { title: 'Konparezon · Laboratwa' };
export const dynamic = 'force-dynamic';

const csv = (v?: string) => (v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const partLabel = (v: string) => (PARTS.find((x) => x[0] === v) ?? [v, v])[1];
const prepLabel = (v: string) => (PREPS.find((x) => x[0] === v) ?? [v, v])[1];

type P = {
  slug: string; name_kr: string; name_sci: string;
  parts_used: string[]; preparations: string[] | null; season_months: number[] | null;
  support_kr: string | null; cautions_kr: string[] | null;
};

export default async function KonparezonPage({
  searchParams,
}: {
  searchParams: { p?: string; lang?: string };
}) {
  const lang = readLang(searchParams);
  const slugs = csv(searchParams.p).slice(0, 3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data: allData } = await sb
    .from('plants').select('slug, name_kr').eq('status', 'published').order('name_kr');
  const all = (allData ?? []) as { slug: string; name_kr: string }[];

  let plants: P[] = [];
  if (slugs.length) {
    const { data } = await sb
      .from('plants')
      .select('slug, name_kr, name_sci, parts_used, preparations, season_months, support_kr, cautions_kr')
      .in('slug', slugs)
      .eq('status', 'published');
    plants = slugs.map((s) => (data ?? []).find((x: P) => x.slug === s)).filter(Boolean) as P[];
  }

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Konparezon</h1>
      <p className="lab-lead">Mete 2–3 plant kòt a kòt pou wè sa achiv la dokimante sou yo.</p>

      <ComparePicker all={all} selected={slugs} />
      <Disclaimer short />

      {plants.length < 2 ? (
        <div className="lab-empty">Chwazi omwen 2 plant pi wo a pou kòmanse konparezon an.</div>
      ) : (
        <>
          <div className="lab-cmpwrap">
            <table className="lab-cmp">
              <thead>
                <tr>
                  <th></th>
                  {plants.map((p) => (
                    <th key={p.slug}>
                      <div className="lab-cname">{p.name_kr}</div>
                      <div className="lab-sci" style={{ fontSize: 12 }}>{p.name_sci}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Pati yo itilize</th>
                  {plants.map((p) => <td key={p.slug}>{p.parts_used.map(partLabel).join(' · ') || '—'}</td>)}
                </tr>
                <tr>
                  <th>Preparasyon</th>
                  {plants.map((p) => <td key={p.slug}>{(p.preparations ?? []).map(prepLabel).join(' · ') || '—'}</td>)}
                </tr>
                <tr>
                  <th>Sipò tradisyonèl</th>
                  {plants.map((p) => (
                    <td key={p.slug}>
                      {p.support_kr || <span className="none">Poko dokimante nan achiv la.</span>}
                    </td>
                  ))}
                </tr>
                <tr className="prek">
                  <th>Prekosyon</th>
                  {plants.map((p) => (
                    <td key={p.slug}>
                      {(p.cautions_kr ?? []).length
                        ? <ul style={{ margin: 0, paddingLeft: 16 }}>{(p.cautions_kr ?? []).map((c, i) => <li key={i}>{c}</li>)}</ul>
                        : <span className="none">Pa gen prekosyon dokimante nan dosye a.</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Sezon</th>
                  {plants.map((p) => <td key={p.slug}>{(p.season_months ?? []).map((m) => MONTHS[m - 1]).join(' · ') || '—'}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="lab-note" style={{ marginTop: 12 }}>
            Kolòn prekosyon an gen menm pwa vizyèl ak rès tablo a espre: yon plant ki pa
            gen prekosyon dokimante pa yon plant « san danje », se yon plant nou pa gen
            dosye sou li ankò.
          </p>
        </>
      )}
    </div>
  );
}
