// Chodyè sou dife — a traditional pot on a charcoal stove, drawn as inline SVG
// (Laboratwa palette, hard-coded so it survives outside the .lab CSS scope).
// `heat` shapes the scene: 'boil' = tall flickering flames + strong rising
// steam + bubbling water, 'low' = glowing embers + gentle steam (hot, not
// boiling), 'none' = cold soak. Motion is CSS (classes below), gated behind
// prefers-reduced-motion in laboratwa.css.

export type Heat = 'none' | 'low' | 'boil';

export default function Chodye({ heat = 'low' }: { heat?: Heat }) {
  const flames = heat === 'boil';
  const embers = heat !== 'none';
  const steam = heat === 'none' ? 0 : heat === 'low' ? 0.55 : 0.9;

  return (
    <svg viewBox="0 0 128 132" width="132" height="136" role="img"
      aria-label="Yon chodyè sou yon recho k ap chofe" style={{ display: 'block', margin: '0 auto' }}>
      {/* steam */}
      {steam > 0 && (
        <g stroke="#8fa79a" strokeWidth="3" strokeLinecap="round" fill="none" opacity={steam}>
          <path className="lab-steam" style={{ animationDelay: '0ms' }} d="M52 50 C47 43 55 39 50 32 C46 27 52 24 49 18" />
          <path className="lab-steam" style={{ animationDelay: '900ms' }} d="M64 48 C59 40 67 36 62 28 C58 22 64 19 61 12" />
          <path className="lab-steam" style={{ animationDelay: '1800ms' }} d="M77 50 C72 43 80 39 75 32 C71 27 77 24 74 18" />
        </g>
      )}

      {/* pot body */}
      <path d="M33 62 Q31 92 64 94 Q97 92 95 62 Z" fill="#4a3527" />
      <path d="M33 62 Q31 92 64 94 Q97 92 95 62" fill="none" stroke="#2c2018" strokeWidth="1.5" opacity=".5" />
      {/* liquid surface */}
      <ellipse cx="64" cy="62" rx="31" ry="8" fill="#6f4a1f" />
      {/* boiling bubbles rising to the surface */}
      {flames && (
        <g fill="#8a5f2b">
          <circle className="lab-bubble" style={{ animationDelay: '0ms' }} cx="54" cy="64" r="2.1" />
          <circle className="lab-bubble" style={{ animationDelay: '500ms' }} cx="66" cy="65" r="2.6" />
          <circle className="lab-bubble" style={{ animationDelay: '950ms' }} cx="74" cy="64" r="1.8" />
          <circle className="lab-bubble" style={{ animationDelay: '1300ms' }} cx="60" cy="66" r="1.6" />
        </g>
      )}
      <ellipse cx="64" cy="62" rx="31" ry="8" fill="none" stroke="#2e6b4f" strokeWidth="1.4" opacity=".5" />
      {/* a floating herb leaf */}
      <path d="M58 61 q6 -5 12 0 q-6 5 -12 0 Z" fill="#2e6b4f" opacity=".85" />
      {/* pot rim */}
      <ellipse cx="64" cy="60" rx="33" ry="8.5" fill="none" stroke="#2c2018" strokeWidth="4" />
      {/* handles */}
      <path d="M31 60 q-8 2 -7 10" fill="none" stroke="#2c2018" strokeWidth="4" strokeLinecap="round" />
      <path d="M97 60 q8 2 7 10" fill="none" stroke="#2c2018" strokeWidth="4" strokeLinecap="round" />

      {/* flames between stove and pot */}
      {flames && (
        <g>
          <path className="lab-flame" style={{ animationDelay: '0ms' }} d="M50 96 C45 88 52 84 50 78 C58 82 58 90 55 96 Z" fill="#a9762a" />
          <path className="lab-flame" style={{ animationDelay: '160ms' }} d="M76 96 C71 88 78 84 76 78 C84 82 84 90 81 96 Z" fill="#a9762a" />
          <path className="lab-flame" style={{ animationDelay: '80ms' }} d="M62 98 C56 88 65 82 62 74 C72 80 71 92 68 98 Z" fill="#c8871f" />
          <path className="lab-flame" style={{ animationDelay: '240ms' }} d="M62 97 C58 90 65 86 62 80 C69 85 68 92 66 97 Z" fill="#e8b562" />
        </g>
      )}

      {/* charcoal stove (recho) */}
      <path d="M40 98 L44 116 L84 116 L88 98 Z" fill="#3b3330" />
      <ellipse cx="64" cy="98" rx="24" ry="6" fill="#2c2622" />
      {/* embers / opening glow */}
      <ellipse className={embers ? 'lab-ember' : undefined} cx="64" cy="99" rx="17" ry="4"
        fill={embers ? '#a9762a' : '#241f1c'} opacity={embers ? 0.95 : 1} />
      {embers && <ellipse className="lab-ember" cx="64" cy="99" rx="9" ry="2.4" fill="#e8b562" />}
      {/* legs */}
      <rect x="45" y="116" width="4" height="7" rx="1.5" fill="#2c2622" />
      <rect x="79" y="116" width="4" height="7" rx="1.5" fill="#2c2622" />
      <rect x="62" y="116" width="4" height="7" rx="1.5" fill="#2c2622" />
    </svg>
  );
}
