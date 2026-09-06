import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Qty, readLang } from '../lab-ui';

export const metadata = {
  title: 'Glosè trileng · Laboratwa',
  description: 'Non plant Ayiti yo an Kreyòl, Franse, Anglè ak non syantifik.',
};
export const dynamic = 'force-dynamic';

const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Row = {
  slug: string; name_kr: string; name_fr: string | null;
  name_en: string | null; name_sci: string;
};

export default async function GloseTrileng({
  searchParams,
}: {
  searchParams: { q?: string; lang?: string };
}) {
  const lang = readLang(searchParams);
  const q = (searchParams.q ?? '').trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants')
    .select('slug, name_kr, name_fr, name_en, name_sci')
    .eq('status', 'published')
    .order('name_kr', { ascending: true });

  let rows = (data ?? []) as Row[];
  if (q) {
    const nq = norm(q);
    rows = rows.filter((r) =>
      norm(`${r.name_kr} ${r.name_fr ?? ''} ${r.name_en ?? ''} ${r.name_sci}`).includes(nq)
    );
  }

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />

      <div className="lab-rhead" style={{ marginTop: 20 }}>
        <h1>Glosè trileng</h1>
        <div className="lab-rcount" aria-live="polite">
          <Qty>{rows.length}</Qty> non
        </div>
      </div>
      <p className="lab-lead">
        Non Kreyòl la se referans lan. Chèche nan nenpòt lang — Kreyòl, Franse,
        Anglè, oswa non syantifik.
      </p>

      <form action="/laboratwa/glose" className="lab-search" role="search">
        {lang !== 'kr' && <input type="hidden" name="lang" value={lang} />}
        <Search strokeWidth={2} aria-hidden />
        <input type="search" name="q" defaultValue={q} placeholder="Chèche yon non…" aria-label="Chèche" />
      </form>

      {rows.length === 0 ? (
        <div className="lab-empty">
          Pa gen non ki koresponn.
          {q && <Link href="/laboratwa/glose" className="lab-reset">Retire rechèch la</Link>}
        </div>
      ) : (
        <div className="lab-tablewrap">
          <table className="lab-table">
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '26%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Kreyòl</th><th>Franse</th><th>Anglè</th><th>Non syantifik</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug}>
                  <td>
                    <Link href={`/laboratwa/plant/${r.slug}`} className="lab-tr-link kr">
                      {r.name_kr}
                    </Link>
                  </td>
                  <td>{r.name_fr || '—'}</td>
                  <td>{r.name_en || '—'}</td>
                  <td className="lab-sci">{r.name_sci}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
