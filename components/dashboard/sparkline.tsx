type SparklineProps = {
  values: number[];
  tone?: 'forest' | 'gold' | 'earth';
};

const TONE_TO_STROKE: Record<NonNullable<SparklineProps['tone']>, string> = {
  forest: '#5A9138',
  gold: '#C9A227',
  earth: '#5C3D2E',
};

export default function Sparkline({ values, tone = 'forest' }: SparklineProps) {
  if (values.length < 2) return null;
  const W = 110;
  const H = 36;
  const P = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = P + (i / (values.length - 1)) * (W - P * 2);
    const y = H - P - ((v - min) / range) * (H - P * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const area = `${d} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;
  const stroke = TONE_TO_STROKE[tone];
  const gradId = `spark-${tone}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full max-w-[140px] h-9">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={d}
        stroke={stroke}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  );
}
