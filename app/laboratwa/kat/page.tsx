import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Qty, readLang } from '../lab-ui';
import { REGIONS } from '../eksplorate/facets';

export const metadata = { title: 'Rejyon · Laboratwa' };
export const dynamic = 'force-dynamic';

export default async function KatPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = readLang(searchParams);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb.from('plants').select('regions').eq('status', 'published');
  const rows = (data ?? []) as { regions: string[] | null }[];

  const counts: Record<string, number> = {};
  for (const r of rows) for (const dep of r.regions ?? []) counts[dep] = (counts[dep] ?? 0) + 1;
  const max = Math.max(1, ...Object.values(counts));

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Plant pa rejyon</h1>
      <p className="lab-lead">
        Konbyen plant ki dokimante nan chak depatman. Klike yon depatman pou wè lis la
        nan Eksploratè a.
      </p>

      <div className="lab-katgrid">
        {REGIONS.map(([code, name]) => {
          const c = counts[code] ?? 0;
          const op = c === 0 ? 0 : 0.12 + (c / max) * 0.6;
          return (
            <Link
              key={code}
              href={`/laboratwa/eksplorate?rejyon=${code}`}
              className="lab-kattile lab-focus"
              title={`${name}: ${c} plant`}
            >
              <span className="fill" style={{ opacity: op }} aria-hidden />
              <span className="inner">
                <span className="dep">{name}</span>
                <span className="cnt"><Qty>{c}</Qty> plant</span>
              </span>
            </Link>
          );
        })}
      </div>

      <p className="lab-note" style={{ marginTop: 16 }}>
        Yon kat jeyografik SVG Ayiti a (pa depatman) ap ranplase vi sa a lè jeyometri kat
        la disponib. Chif yo montre sa ki dokimante — se pa yon konte total plant ki nan
        chak zòn.
      </p>
    </div>
  );
}
