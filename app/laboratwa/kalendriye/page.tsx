import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Qty, readLang } from '../lab-ui';
import { MONTHS } from '../eksplorate/facets';

export const metadata = { title: 'Kalendriye sezon · Laboratwa' };
export const dynamic = 'force-dynamic';

const FULL = ['Janvye','Fevriye','Mas','Avril','Me','Jen','Jiyè','Out','Septanm','Oktòb','Novanm','Desanm'];

type P = { slug: string; name_kr: string; season_months: number[] | null };

export default async function KalendriyePage({
  searchParams,
}: {
  searchParams: { mwa?: string; lang?: string };
}) {
  const lang = readLang(searchParams);
  const mwa = Math.min(12, Math.max(0, Number(searchParams.mwa) || 0)); // 0 = none selected

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants').select('slug, name_kr, season_months').eq('status', 'published').order('name_kr');
  const plants = (data ?? []) as P[];

  const monthHref = (m: number) => {
    const p = new URLSearchParams();
    if (lang !== 'kr') p.set('lang', lang);
    if (m) p.set('mwa', String(m));
    const qs = p.toString();
    return qs ? `/laboratwa/kalendriye?${qs}` : '/laboratwa/kalendriye';
  };
  const inMonth = mwa ? plants.filter((p) => (p.season_months ?? []).includes(mwa)) : [];

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Kalendriye sezon</h1>
      <p className="lab-lead">
        Ki plant ki nan sezon nan ki mwa. Klike yon mwa pou wè lis la. Se dapre dosye a;
        se pa yon garanti sou dat egzak yo.
      </p>

      <div className="lab-calwrap">
        <div className="lab-cal">
          <div className="lab-calrow lab-calhead">
            <span />
            {MONTHS.map((m, i) => (
              <Link key={m} href={monthHref(i + 1)} aria-label={FULL[i]}>
                <span className={mwa === i + 1 ? 'now' : ''} style={{ display: 'block' }}>{m}</span>
              </Link>
            ))}
          </div>
          {plants.map((p) => (
            <div className="lab-calrow" key={p.slug}>
              <span className="lab-calname">
                <Link href={`/laboratwa/plant/${p.slug}`}>{p.name_kr}</Link>
              </span>
              {MONTHS.map((_, i) => (
                <span key={i} className={`lab-calcell ${(p.season_months ?? []).includes(i + 1) ? 'on' : ''}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {mwa > 0 && (
        <div className="lab-result" aria-live="polite" style={{ marginTop: 18 }}>
          <span className="lab-label">{FULL[mwa - 1]}</span>
          <div style={{ marginBottom: 10 }}>
            <Qty>{inMonth.length}</Qty> plant nan sezon
          </div>
          {inMonth.length ? (
            <div className="lab-chips">
              {inMonth.map((p) => (
                <Link key={p.slug} href={`/laboratwa/plant/${p.slug}`} className="lab-chip">
                  {p.name_kr}
                </Link>
              ))}
            </div>
          ) : (
            <span className="none" style={{ color: 'var(--tes)' }}>Pa gen plant dokimante pou mwa sa a.</span>
          )}
        </div>
      )}
    </div>
  );
}
