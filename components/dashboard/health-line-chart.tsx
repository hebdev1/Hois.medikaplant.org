/**
 * Pure-SVG line chart for the Swivi Sante page. Server-renderable.
 *
 * Renders the user's measurements over time, with a translucent target-zone
 * band, dashed boundary lines, light y-gridlines, a green→gold gradient
 * stroke, area fill below the curve, points, and a compact pill label on
 * the latest reading. Empty-state shows a calming "no data yet" pattern.
 */

type Point = {
  loggedAt: string; // ISO
  value: number;
};

type Props = {
  points: Point[]; // chronological (oldest → newest)
  targetMin: number;
  targetMax: number;
  unit: string;
  rangeDays: number;
  /** Override the gradient stops if you want a per-metric color story */
  stroke?: { from: string; to: string };
};

const DAY_LABEL_FMT = new Intl.DateTimeFormat('fr-HT', {
  day: 'numeric',
  month: 'short',
});

export default function HealthLineChart({
  points,
  targetMin,
  targetMax,
  unit,
  rangeDays,
  stroke = { from: '#435b12', to: '#e78e17' },
}: Props) {
  const W = 900;
  const H = 280;
  const PAD_L = 52;
  const PAD_R = 18;
  const PAD_T = 22;
  const PAD_B = 38;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  if (points.length === 0) {
    return <EmptyChart W={W} H={H} rangeDays={rangeDays} />;
  }

  // Bounds — pad around the value range AND the target so the band is visible
  const vals = points.map((p) => p.value);
  const vMin = Math.min(...vals, targetMin) - 6;
  const vMax = Math.max(...vals, targetMax) + 6;
  const vRange = Math.max(1, vMax - vMin);

  const x = (i: number) =>
    PAD_L + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD_T + innerH - ((v - vMin) / vRange) * innerH;

  const pts = points.map((p, i) => [x(i), y(p.value)] as const);
  const linePath = pts
    .map(([px, py], i) => (i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`))
    .join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${
    PAD_T + innerH
  } L ${pts[0][0]} ${PAD_T + innerH} Z`;

  const zoneTop = y(targetMax);
  const zoneBottom = y(targetMin);

  // 4–5 evenly spaced y-ticks
  const tickStep = niceStep(vRange / 4);
  const tickStart = Math.ceil(vMin / tickStep) * tickStep;
  const yTicks: number[] = [];
  for (let v = tickStart; v <= vMax; v += tickStep) yTicks.push(v);

  // X-axis labels — only show ~6 (skip evenly)
  const labelEvery = Math.max(1, Math.floor(points.length / 6));
  const lastIdx = points.length - 1;
  const latest = points[lastIdx];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      role="img"
      aria-label={`Grafik evolisyon ${unit} sou ${rangeDays} jou`}
    >
      <defs>
        <linearGradient id="hlc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke.from} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke.from} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hlc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stroke.from} />
          <stop offset="100%" stopColor={stroke.to} />
        </linearGradient>
      </defs>

      {/* Target band */}
      <rect
        x={PAD_L}
        y={zoneTop}
        width={innerW}
        height={Math.max(2, zoneBottom - zoneTop)}
        fill="#93b031"
        opacity="0.1"
      />
      <line
        x1={PAD_L}
        x2={PAD_L + innerW}
        y1={zoneTop}
        y2={zoneTop}
        stroke="#93b031"
        strokeDasharray="3 4"
        strokeWidth="1"
      />
      <line
        x1={PAD_L}
        x2={PAD_L + innerW}
        y1={zoneBottom}
        y2={zoneBottom}
        stroke="#93b031"
        strokeDasharray="3 4"
        strokeWidth="1"
      />
      <text
        x={PAD_L + innerW - 4}
        y={zoneTop - 6}
        textAnchor="end"
        fontSize="10"
        fill="#65881a"
        fontWeight="600"
      >
        Zòn sib {targetMin}–{targetMax} {unit}
      </text>

      {/* Y gridlines + labels */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={PAD_L + innerW}
            y1={y(v)}
            y2={y(v)}
            stroke="#EDE8DC"
            strokeWidth="1"
          />
          <text
            x={PAD_L - 8}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#8A8A8A"
          >
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Area + line */}
      {pts.length > 1 && <path d={areaPath} fill="url(#hlc-fill)" />}
      <path
        d={linePath}
        stroke="url(#hlc-stroke)"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points (latest gets emphasis) */}
      {pts.map(([px, py], i) => (
        <circle
          key={i}
          cx={px}
          cy={py}
          r={i === lastIdx ? 4.5 : 3.2}
          fill="#FFFDF8"
          stroke={i === lastIdx ? '#e78e17' : '#435b12'}
          strokeWidth={i === lastIdx ? 2.5 : 1.8}
        />
      ))}

      {/* Latest value pill */}
      {pts.length > 0 &&
        (() => {
          const [px, py] = pts[lastIdx];
          const txt = `${latest.value} ${unit}`;
          const w = Math.max(64, txt.length * 7 + 12);
          // Flip below the point if too close to the top
          const above = py > PAD_T + 32;
          const ry = above ? py - 32 : py + 12;
          return (
            <g>
              <rect
                x={Math.min(W - PAD_R - w, Math.max(PAD_L, px - w / 2))}
                y={ry}
                width={w}
                height={22}
                rx="6"
                fill="#33450e"
              />
              <text
                x={Math.min(W - PAD_R - w / 2, Math.max(PAD_L + w / 2, px))}
                y={ry + 15}
                textAnchor="middle"
                fontSize="11"
                fill="#FAF6ED"
                fontWeight="700"
              >
                {txt}
              </text>
            </g>
          );
        })()}

      {/* X-axis labels */}
      {points.map((p, i) => {
        if (i !== lastIdx && i % labelEvery !== 0) return null;
        return (
          <text
            key={i}
            x={x(i)}
            y={H - 14}
            fontSize="10"
            fill="#8A8A8A"
            textAnchor="middle"
          >
            {DAY_LABEL_FMT.format(new Date(p.loggedAt))}
          </text>
        );
      })}
    </svg>
  );
}

function EmptyChart({
  W,
  H,
  rangeDays,
}: {
  W: number;
  H: number;
  rangeDays: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      role="img"
      aria-label="Pa gen mezi pou peryòd la"
    >
      <rect width={W} height={H} fill="#FAF6ED" />
      <text
        x={W / 2}
        y={H / 2 - 6}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#5C3D2E"
      >
        Pa gen mezi nan {rangeDays} dènye jou yo
      </text>
      <text
        x={W / 2}
        y={H / 2 + 14}
        textAnchor="middle"
        fontSize="11"
        fill="#8A8A8A"
      >
        Ajoute premye mezi w pi ba la — chif yo ap fòme istwa w
      </text>
    </svg>
  );
}

/**
 * Pick a "nice" round step (1, 2, 5, 10, 20, 50, …) close to the raw value
 * so the y-axis ticks land on readable integers.
 */
function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  let nice = 10;
  if (norm < 1.5) nice = 1;
  else if (norm < 3) nice = 2;
  else if (norm < 7) nice = 5;
  return nice * pow;
}
