import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, readLang } from '../../../lab-ui';
import Chodye, { type Heat } from '../../../pot-illustration';
import { remedSlug } from '../../remed-slug';

export const dynamic = 'force-dynamic';

type Rec = { name_kr: string; sci?: string; prep?: string; tramil?: string };
type Cond = {
  slug: string; name_kr: string; red_flag_kr: string | null; doctor_limit_kr: string | null; plants: Rec[];
};

// Which animation to show, inferred from the documented preparation text.
function heatFor(prep: string): Heat {
  const t = (prep || '').toLowerCase();
  if (/bouyi|dekoksyon/.test(t)) return 'boil';
  if (/tizann|enfizyon|dlo cho/.test(t)) return 'low';
  if (/aplike|masaje|kraze|lwil|\bji\b|beny|konprese/.test(t)) return 'none';
  return 'low';
}

async function load(kondisyon: string, remed: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('lab_conditions')
    .select('slug, name_kr, red_flag_kr, doctor_limit_kr, plants')
    .eq('slug', kondisyon)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return null;
  const cond = data as Cond;
  const plant = (cond.plants ?? []).find((p) => remedSlug(p.name_kr) === remed);
  return plant ? { cond, plant } : null;
}

export async function generateMetadata({ params }: { params: { kondisyon: string; remed: string } }) {
  const r = await load(params.kondisyon, params.remed);
  if (!r) return { title: 'Remèd · Laboratwa' };
  return { title: `${r.plant.name_kr} · ${r.cond.name_kr} · Laboratwa` };
}

export default async function RemedPage({
  params,
  searchParams,
}: {
  params: { kondisyon: string; remed: string };
  searchParams: { lang?: string };
}) {
  const lang = readLang(searchParams);
  const r = await load(params.kondisyon, params.remed);
  if (!r) notFound();
  const { cond, plant } = r;
  const heat = heatFor(plant.prep ?? '');

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60, maxWidth: 640 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa/maladi', label: 'Maladi & Plant' }} />

      <div style={{ marginTop: 20 }}>
        <div className="lab-eyebrow">Pou {cond.name_kr}</div>
        <h1 style={{ margin: '8px 0 2px' }}>{plant.name_kr}</h1>
        {plant.sci && <div className="lab-sci" style={{ fontSize: 14 }}>{plant.sci}</div>}
        <div style={{ marginTop: 8 }}>
          <span className="lab-tramil">{plant.tramil || 'REK'}</span>
        </div>
      </div>

      {/* Animated preparation */}
      <div style={{ margin: '22px 0 8px' }}>
        <Chodye heat={heat} />
      </div>

      <div className="lab-sec">
        <span className="lab-label">Preparasyon dokimante</span>
        <p className="lab-body" style={{ fontSize: 15, lineHeight: 1.65 }}>{plant.prep || '—'}</p>
        <p className="lab-note">
          Kantite sa a soti nan dosye TRAMIL la — <strong>se pa yon doz pou yon moun</strong>.
          Se yon konpleman pou swen medikal, pa yon ranplasman.
        </p>
      </div>

      {cond.red_flag_kr && (
        <div className="lab-redflag">
          <AlertTriangle size={16} strokeWidth={2.2} aria-hidden />
          <div>
            <span className="lim">Drapo wouj{cond.doctor_limit_kr ? ` · ${cond.doctor_limit_kr}` : ''}.</span>{' '}
            {cond.red_flag_kr}
          </div>
        </div>
      )}

      <Disclaimer short />

      <Link href="/laboratwa/maladi" className="lab-back" style={{ marginTop: 18 }}>
        ‹ Tounen nan Maladi &amp; Plant
      </Link>
    </div>
  );
}
