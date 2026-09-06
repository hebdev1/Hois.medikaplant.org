import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Leaf, Sprout } from 'lucide-react';
import { LabHeader, Disclaimer, readLang } from '../../lab-ui';

export const dynamic = 'force-dynamic';

type Method = {
  label: string; icon: 'fey' | 'rasin'; water: string;
  temp: string; time: string; cover: string; why: string; contrast: string;
};

const METHODS: Record<string, Method> = {
  te: { label: 'Te (enfizyon)', icon: 'fey', water: '20%', temp: 'Dlo cho, pa bouyi', time: '5–10 min', cover: 'Wi, kouvri', contrast: 'bouyi',
    why: 'Pou fèy ak flè delika: chalè twò fò gaspiye sant ak gou yo. Vide dlo cho sou yo epi kite yo poze.' },
  tranpe: { label: 'Tranpe (maserasyon)', icon: 'fey', water: '24%', temp: 'Dlo tyèd oswa frèt', time: 'Plizyè èdtan', cover: 'Wi', contrast: 'bouyi',
    why: 'Pou eleman ki frajil ak chalè: yo poze nan dlo san chofe, dousman.' },
  bouyi: { label: 'Bouyi (dekoksyon)', icon: 'rasin', water: '12%', temp: 'Dlo k ap bouyi', time: '10–20 min', cover: 'Souvan san kouvri', contrast: 'te',
    why: 'Pou rasin, ekòs ak pati di: yo bezwen chalè ak tan pou yo lage sa ki ladan yo.' },
  konpes: { label: 'Konpès', icon: 'fey', water: '30%', temp: 'Cho oswa tyèd', time: 'Aplike sou po a', cover: '—', contrast: 'benyen',
    why: 'Yon twal mouye ak preparasyon an, aplike deyò sou po a — pa bwè l.' },
  benyen: { label: 'Benyen', icon: 'fey', water: '16%', temp: 'Tyèd', time: '—', cover: '—', contrast: 'konpes',
    why: 'Yon gwo enfizyon oswa dekoksyon moun konn itilize pou benyen, deyò sou kò a.' },
  siwo: { label: 'Siwo', icon: 'fey', water: '35%', temp: 'Chofe dousman', time: 'Jiskaske li epesi', cover: '—', contrast: 'luil',
    why: 'Melanj ak sik oswa siwo, chofe dousman pou li konsève epi vin dous.' },
  luil: { label: 'Luil (masere)', icon: 'fey', water: '28%', temp: 'Frèt oswa chofe dousman', time: 'Plizyè jou', cover: '—', contrast: 'siwo',
    why: 'Pati plant lan tranpe nan luil pou eleman ki fonn nan grès yo pase nan luil la.' },
};

export function generateStaticParams() {
  return Object.keys(METHODS).map((metod) => ({ metod }));
}
export function generateMetadata({ params }: { params: { metod: string } }) {
  const m = METHODS[params.metod];
  return { title: m ? `${m.label} · Preparasyon · Laboratwa` : 'Preparasyon · Laboratwa' };
}

function Col({ m }: { m: Method }) {
  const Icon = m.icon === 'rasin' ? Sprout : Leaf;
  return (
    <div className="lab-prepcol">
      <span className="lab-label">{m.label}</span>
      <div className="lab-cup"><span className="water" style={{ top: m.water }}><span className="lvl">nivo dlo</span></span></div>
      <div style={{ textAlign: 'center', color: m.icon === 'rasin' ? 'var(--te)' : 'var(--fey)' }}>
        <Icon size={20} strokeWidth={1.8} aria-hidden />
      </div>
      <table className="lab-preptable">
        <tbody>
          <tr><td>Tanperati dlo</td><td className="lab-qty">{m.temp}</td></tr>
          <tr><td>Tan</td><td className="lab-qty">{m.time}</td></tr>
          <tr><td>Kouvri</td><td>{m.cover}</td></tr>
        </tbody>
      </table>
      <p className="lab-body" style={{ fontSize: 12.5 }}>{m.why}</p>
    </div>
  );
}

export default function PreparasyonPage({
  params,
  searchParams,
}: {
  params: { metod: string };
  searchParams: { lang?: string };
}) {
  const lang = readLang(searchParams);
  const m = METHODS[params.metod];
  if (!m) notFound();
  const contrast = METHODS[m.contrast];

  return (
    <div className="lab-wrap" style={{ paddingBottom: 60 }}>
      <LabHeader lang={lang} back={{ href: '/laboratwa', label: 'Laboratwa' }} />
      <h1 style={{ marginTop: 20 }}>Preparasyon: {m.label}</h1>
      <p className="lab-lead">
        Kijan metòd sa a diferan de yon lòt. Se yon eksplikasyon jeneral sou teknik la;
        kantite egzak pou chak plant soti nan resèt ki dokimante nan achiv la.
      </p>

      <div className="lab-methchips">
        {Object.entries(METHODS).map(([key, v]) => (
          <Link key={key} href={`/laboratwa/preparasyon/${key}`}
            className={`lab-chip ${key === params.metod ? 'on' : ''}`}>
            {v.label.split(' ')[0]}
          </Link>
        ))}
      </div>

      <div className="lab-prep2">
        <Col m={m} />
        <Col m={contrast} />
      </div>

      <p className="lab-note">
        Pa gen chan pou antre pwa yon moun. Yon kantite se pa yon doz pou yon moun.
      </p>
      <Disclaimer short />
    </div>
  );
}
