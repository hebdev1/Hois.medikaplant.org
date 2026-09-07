import Link from 'next/link';
import { Search, Sprout, GitCompare, Stethoscope, CalendarDays, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LabHeader, Disclaimer, Qty, readLang } from './lab-ui';
import OpenRemedButton from './open-remed-button';

export const metadata = {
  title: 'Laboratwa a · Hois Medikaplant',
  description:
    'Yon espas pou konprann konesans tradisyonèl sou plant Ayiti yo: ki pati moun konn itilize, kijan yo prepare l, ak ki prekosyon ki dokimante.',
};
export const dynamic = 'force-dynamic';

export default async function LaboratwaHome({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  const lang = readLang(searchParams);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { count } = await sb
    .from('plants')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  const total = count ?? 0;

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} nav />

      <div style={{ marginTop: 22 }}>
        <div className="lab-eyebrow">ACHIV KONESANS</div>
        <h1>Laboratwa a</h1>
        <p className="lab-lead">
          Yon espas pou konprann konesans tradisyonèl sou plant Ayiti yo: ki pati
          moun konn itilize, kijan yo prepare l, ak ki prekosyon ki dokimante.
        </p>
      </div>

      <Disclaimer />

      <form action="/laboratwa/eksplorate" className="lab-search" role="search">
        <Search strokeWidth={2} aria-hidden />
        <input
          type="search"
          name="q"
          placeholder="Chèche yon plant, yon non, yon tèm…"
          aria-label="Chèche"
        />
      </form>

      <div className="lab-tools">
        <Link href="/laboratwa/eksplorate" className="lab-tool feat">
          <Sprout strokeWidth={1.8} aria-hidden />
          <span className="lab-tool-t">Eksploratè Plant</span>
          <span className="lab-tool-d">Filtre pa pati, preparasyon, sezon ak rejyon.</span>
        </Link>
        <Link href="/laboratwa/maladi" className="lab-tool">
          <Stethoscope strokeWidth={1.8} aria-hidden />
          <span className="lab-tool-t">Maladi &amp; Plant</span>
          <span className="lab-tool-d">Kondisyon yo ak plant TRAMIL rekòmande pou yo.</span>
        </Link>
        <Link href="/laboratwa/konparezon" className="lab-tool">
          <GitCompare strokeWidth={1.8} aria-hidden />
          <span className="lab-tool-t">Konparezon</span>
          <span className="lab-tool-d">Mete 2–3 plant kòt a kòt.</span>
        </Link>
        <Link href="/laboratwa/kalendriye" className="lab-tool">
          <CalendarDays strokeWidth={1.8} aria-hidden />
          <span className="lab-tool-t">Kalendriye sezon</span>
          <span className="lab-tool-d">12 mwa, ki plant nan ki sezon.</span>
        </Link>
      </div>

      <div className="lab-slist">
        {[
          ['Preparasyon tradisyonèl', '/laboratwa/preparasyon/te'],
          ['Plant pa rejyon', '/laboratwa/kat'],
          ['Konnen fèy ou — jwèt', '/laboratwa/jwet'],
          ['Kontribye yon non', '/laboratwa/kontribye'],
        ].map(([label, href]) => (
          <Link className="lab-srow" key={href} href={href}>
            <span>{label}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
          </Link>
        ))}
        <OpenRemedButton />
      </div>

      <Link
        href="/dashboard"
        className="lab-srow"
        style={{ borderBottom: 'none', marginTop: 6, fontWeight: 500 }}
      >
        <span>
          Aprann plis nan Inivèsite a — <Qty>{total}</Qty> plant nan achiv la
        </span>
        <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
