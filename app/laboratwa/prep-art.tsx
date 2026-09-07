import Chodye from './pot-illustration';

// Picks the right preparation illustration from the documented prep text:
// juice -> a glass of juice, water (coconut water) -> a glass of water,
// decoction/tea -> the animated pot on fire, topical -> an ointment jar.
export type PrepKind = 'boil' | 'low' | 'ji' | 'dlo' | 'topik';

export function kindForPrep(prep: string): PrepKind {
  const t = (prep || '').toLowerCase();
  if (/\bji\b|jus/.test(t)) return 'ji';
  if (/dlo kokoye|dlo fre|dlo frèt kokoye/.test(t)) return 'dlo';
  if (/bouyi|dekoksyon/.test(t)) return 'boil';
  if (/tizann|enfizyon|dlo cho/.test(t)) return 'low';
  if (/aplike|masaje|kraze|lwil|konprese|beny/.test(t)) return 'topik';
  return 'low';
}

function JuiceGlass() {
  return (
    <svg viewBox="0 0 128 132" width="132" height="136" role="img"
      aria-label="Yon vè ji" style={{ display: 'block', margin: '0 auto' }}>
      {/* straw */}
      <line x1="74" y1="34" x2="60" y2="74" stroke="#2e6b4f" strokeWidth="4" strokeLinecap="round" />
      {/* glass */}
      <path d="M40 46 L46 116 Q46 120 50 120 L78 120 Q82 120 82 116 L88 46 Z" fill="#fff8ee" stroke="#4a3527" strokeWidth="2.5" strokeLinejoin="round" />
      {/* juice */}
      <path d="M43.6 64 L47 115 Q47 117 49.5 117 L78.5 117 Q81 117 81 115 L84.4 64 Z" fill="#dd922a" />
      <ellipse cx="64" cy="64" rx="20.4" ry="4" fill="#f0ad42" />
      <path d="M45 116 L47 100 Q64 96 81 100 L83 116 Z" fill="#000" opacity=".06" />
      {/* citrus slice on the rim */}
      <circle cx="84" cy="46" r="10" fill="#f2b24e" stroke="#c8871f" strokeWidth="2" />
      <g stroke="#c8871f" strokeWidth="1.2">
        <line x1="84" y1="46" x2="84" y2="37" /><line x1="84" y1="46" x2="92" y2="50" />
        <line x1="84" y1="46" x2="76" y2="50" /><line x1="84" y1="46" x2="90" y2="40" /><line x1="84" y1="46" x2="78" y2="40" />
      </g>
      {/* highlight */}
      <line x1="49" y1="60" x2="52" y2="110" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

function WaterGlass() {
  return (
    <svg viewBox="0 0 128 132" width="132" height="136" role="img"
      aria-label="Yon vè dlo" style={{ display: 'block', margin: '0 auto' }}>
      <path d="M40 46 L46 116 Q46 120 50 120 L78 120 Q82 120 82 116 L88 46 Z" fill="#fbfdfe" stroke="#4a3527" strokeWidth="2.5" strokeLinejoin="round" />
      {/* water */}
      <path d="M43.2 60 L47 115 Q47 117 49.5 117 L78.5 117 Q81 117 81 115 L84.8 60 Z" fill="#bfe0ee" opacity=".9" />
      <ellipse cx="64" cy="60" rx="21" ry="4.2" fill="#a9d3e6" />
      {/* bubbles */}
      <circle cx="58" cy="92" r="2.4" fill="#eaf6fb" />
      <circle cx="70" cy="82" r="1.8" fill="#eaf6fb" />
      <circle cx="64" cy="102" r="1.5" fill="#eaf6fb" />
      <line x1="49" y1="58" x2="52" y2="110" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

function TopicalJar() {
  return (
    <svg viewBox="0 0 128 132" width="132" height="136" role="img"
      aria-label="Yon po pou aplike sou po a" style={{ display: 'block', margin: '0 auto' }}>
      {/* leaf on top */}
      <path d="M64 40 q14 -10 26 -2 q-12 12 -26 2 Z" fill="#2e6b4f" />
      <path d="M64 40 q-14 -10 -26 -2 q12 12 26 2 Z" fill="#3a7d5e" />
      <line x1="64" y1="40" x2="64" y2="52" stroke="#2c2018" strokeWidth="2" strokeLinecap="round" />
      {/* jar body */}
      <path d="M38 66 Q36 116 64 118 Q92 116 90 66 Z" fill="#e7cfa2" stroke="#4a3527" strokeWidth="2.5" strokeLinejoin="round" />
      {/* jar rim / lid */}
      <rect x="34" y="54" width="60" height="16" rx="6" fill="#5C3D2E" />
      <rect x="40" y="58" width="48" height="4" rx="2" fill="#7a5533" />
      {/* content sheen */}
      <ellipse cx="56" cy="86" rx="9" ry="5" fill="#fff" opacity=".25" />
    </svg>
  );
}

export default function PrepArt({ kind }: { kind: PrepKind }) {
  if (kind === 'ji') return <JuiceGlass />;
  if (kind === 'dlo') return <WaterGlass />;
  if (kind === 'topik') return <TopicalJar />;
  return <Chodye heat={kind === 'boil' ? 'boil' : 'low'} />;
}
