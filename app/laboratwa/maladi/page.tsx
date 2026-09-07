import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, readLang } from '../lab-ui';
import { remedSlug } from './remed-slug';

export const metadata = {
  title: 'Maladi & Plant · Laboratwa',
  description:
    'Kèk kondisyon sante moun konn genyen souvan ak plant TRAMIL dokimante pou yo — non, preparasyon, estati TRAMIL ak drapo wouj.',
};
export const dynamic = 'force-dynamic';

type PlantRec = { name_kr: string; sci?: string; prep?: string; tramil?: string };
type Cond = {
  slug: string; name_kr: string; intro_kr: string | null;
  red_flag_kr: string | null; doctor_limit_kr: string | null; doctor_attention_kr: string | null;
  plants: PlantRec[];
};

export default async function MaladiPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = readLang(searchParams);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('lab_conditions')
    .select('slug, name_kr, intro_kr, red_flag_kr, doctor_limit_kr, doctor_attention_kr, plants')
    .eq('status', 'published')
    .order('display_order', { ascending: true });
  const conds = (data ?? []) as Cond[];

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Maladi &amp; Plant</h1>
      <p className="lab-lead">
        Kèk kondisyon sante moun konn genyen souvan ak plant TRAMIL dokimante pou yo. Non
        Kreyòl ak botanik, fason pou prepare yo, estati TRAMIL, ak kilè pou ale wè yon doktè.
      </p>

      <Disclaimer />
      <p className="lab-note" style={{ marginTop: -6 }}>
        Kantite ki make yo soti nan dosye TRAMIL la — <strong>se pa yon doz pou yon moun</strong>.
        Tout plant sa yo klase <span className="lab-tramil">REK</span> (rekòmande) epi yo se yon
        konpleman pou swen medikal, pa yon ranplasman.
      </p>

      {conds.map((c) => (
        <section className="lab-cond" key={c.slug}>
          <div className="lab-cond-h">
            <h2>{c.name_kr}</h2>
            {c.intro_kr && <p>{c.intro_kr}</p>}
          </div>
          <div className="lab-cond-body">
            <div className="lab-tablewrap" style={{ border: 'none', marginTop: 8 }}>
              <table className="lab-table" style={{ minWidth: 420 }}>
                <thead>
                  <tr><th>Plant</th><th>Preparasyon dokimante</th><th>TRAMIL</th></tr>
                </thead>
                <tbody>
                  {c.plants.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <Link href={`/laboratwa/maladi/${c.slug}/${remedSlug(p.name_kr)}`} className="lab-tr-link">
                          <div style={{ fontFamily: 'var(--ff-disp)', fontWeight: 600, fontSize: 15, color: 'var(--fey)' }}>
                            {p.name_kr} <span aria-hidden style={{ fontFamily: 'var(--ff-body)', fontWeight: 400 }}>›</span>
                          </div>
                          {p.sci && <div className="lab-sci" style={{ fontSize: 12 }}>{p.sci}</div>}
                        </Link>
                      </td>
                      <td style={{ fontSize: 12.5, lineHeight: 1.5 }}>{p.prep || '—'}</td>
                      <td><span className="lab-tramil">{p.tramil || 'REK'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {c.red_flag_kr && (
              <div className="lab-redflag">
                <AlertTriangle size={16} strokeWidth={2.2} aria-hidden />
                <div>
                  <span className="lim">Drapo wouj{c.doctor_limit_kr ? ` · ${c.doctor_limit_kr}` : ''}.</span>{' '}
                  {c.red_flag_kr}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* When to see a doctor — summary */}
      <h2 style={{ fontSize: 22, marginTop: 30 }}>Ki lè pou wè yon doktè</h2>
      <div className="lab-tablewrap">
        <table className="lab-table" style={{ minWidth: 480 }}>
          <thead>
            <tr><th>Kondisyon</th><th>Limit anvan wè doktè</th><th>Atansyon patikilye</th></tr>
          </thead>
          <tbody>
            {conds.map((c) => (
              <tr key={c.slug}>
                <td style={{ fontWeight: 600 }}>{c.name_kr}</td>
                <td className="lab-qty" style={{ borderBottom: 'none' }}>{c.doctor_limit_kr || '—'}</td>
                <td style={{ fontSize: 12.5 }}>{c.doctor_attention_kr || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="lab-note" style={{ marginTop: 14 }}>
        Prensip jeneral: nenpòt plant isit se yon konpleman pou swen medikal — pa yon
        ranplasman. Pifò pa rekòmande pandan gwosès, laktasyon, oswa lakay timoun piti san
        konsèy. Toujou di doktè w ki plant w ap pran. Sous: TRAMIL (tramil.net).
      </p>
    </div>
  );
}
