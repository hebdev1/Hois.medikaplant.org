import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Triangle, GraduationCap, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, Qty, readLang } from '../../lab-ui';
import { PARTS, PREPS, REGIONS, MONTHS, type PlantRow } from '../../eksplorate/facets';

export const dynamic = 'force-dynamic';

const partLabel = (v: string) => (PARTS.find((x) => x[0] === v) ?? [v, v])[1];
const prepLabel = (v: string) => (PREPS.find((x) => x[0] === v) ?? [v, v])[1];
const regionLabel = (v: string) => (REGIONS.find((x) => x[0] === v) ?? [v, v])[1];

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants')
    .select('name_kr, name_sci')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return { title: 'Plant · Laboratwa' };
  return { title: `${data.name_kr} · Laboratwa`, description: `${data.name_kr} (${data.name_sci}) nan achiv Laboratwa a.` };
}

export default async function PlantDetail({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { lang?: string };
}) {
  const lang = readLang(searchParams);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('plants')
    .select(
      'slug, name_kr, name_fr, name_en, name_sci, family, parts_used, preparations, season_months, regions, summary_kr, support_kr, cautions_kr, photos'
    )
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) notFound();
  const p = data as PlantRow & { support_kr: string | null; cautions_kr: string[] | null };

  const cautions = p.cautions_kr ?? [];
  const seasonTxt = (p.season_months ?? []).map((m) => MONTHS[m - 1]).join(' · ');
  const regionTxt = (p.regions ?? []).map(regionLabel).join(' · ');

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa/eksplorate', label: 'Eksploratè' }} />

      {/* Gallery — placeholders until photos are added */}
      <div className="lab-gallery" style={{ marginTop: 18 }}>
        <div className="lab-gmain">
          <span className="lab-nofoto">Pa gen foto ankò</span>
        </div>
        <div className="lab-gcol">
          <div className="lab-gimg"><span className="lab-nofoto">Fèy</span></div>
          <div className="lab-gimg"><span className="lab-nofoto">Prepare</span></div>
        </div>
      </div>

      <h1 style={{ marginBottom: 2 }}>{p.name_kr}</h1>
      <div className="lab-sci" style={{ fontSize: 14 }}>
        {p.name_sci}{p.family ? ` · ${p.family}` : ''}
      </div>

      <table className="lab-names">
        <tbody>
          <tr><td>Franse</td><td>{p.name_fr || '—'}</td></tr>
          <tr><td>Anglè</td><td>{p.name_en || '—'}</td></tr>
          <tr><td>Pati</td><td>{p.parts_used.map(partLabel).join(' · ') || '—'}</td></tr>
        </tbody>
      </table>

      <Disclaimer short />

      {/* Traditional support */}
      <div className="lab-sec">
        <span className="lab-label">Sipò tradisyonèl</span>
        {p.support_kr ? (
          <p className="lab-body">{p.support_kr}</p>
        ) : (
          <p className="lab-body" style={{ color: 'var(--tes)' }}>
            Nou poko gen yon dosye ekri sou fason yo itilize plant sa a
            tradisyonèlman. L ap parèt isit la lè yon moun nan ekip la dokimante l.
          </p>
        )}
      </div>

      {/* Preparations — methods documented on the plant; step-by-step recipes come later */}
      <div className="lab-sec">
        <span className="lab-label">Preparasyon tradisyonèl</span>
        {(p.preparations ?? []).length ? (
          <>
            <p className="lab-body">
              Metòd moun konn itilize:{' '}
              {(p.preparations ?? []).map(prepLabel).join(', ')}.
            </p>
            <p className="lab-note">
              Etap ak kantite yo ap soti nan achiv resèt la; nou pa montre okenn
              kantite ki pa dokimante, epi yon kantite pa yon doz pou yon moun.
            </p>
          </>
        ) : (
          <p className="lab-body" style={{ color: 'var(--tes)' }}>
            Nou poko gen preparasyon dokimante pou plant sa a.
          </p>
        )}
      </div>

      {/* Precautions — deliberately the most prominent block */}
      <div className="lab-prek">
        <div className="lab-prek-h">
          <Triangle size={13} strokeWidth={2.4} aria-hidden />
          Prekosyon
        </div>
        {cautions.length ? (
          <ul>
            {cautions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        ) : (
          <p className="lab-prek-empty">Pa gen prekosyon dokimante nan dosye a.</p>
        )}
        <p className="lab-note">
          Nou montre sa ki dokimante. Absans yon prekosyon pa vle di pa gen danje.
        </p>
      </div>

      {/* Season / region */}
      <div className="lab-sec" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <span className="lab-label">Sezon</span>
          <div className="lab-body">{seasonTxt || '—'}</div>
        </div>
        <div>
          <span className="lab-label">Rejyon</span>
          <div className="lab-body">{regionTxt || '—'}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="lab-actions">
        <Link href="/klas" className="lab-btn out">
          <GraduationCap size={16} strokeWidth={2} aria-hidden />
          Leson Inivèsite sou plant yo
        </Link>
        <a
          href="https://www.medikaplantshop.com"
          target="_blank"
          rel="noopener noreferrer"
          className="lab-btn ghost"
        >
          <ShoppingBag size={16} strokeWidth={2} aria-hidden />
          Wè nan boutik la
        </a>
      </div>
    </div>
  );
}
