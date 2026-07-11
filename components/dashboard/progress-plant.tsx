type ProgressPlantProps = {
  day: number;
  total: number;
  todayCompletion: number; // 0..1
};

/**
 * Animated growing-plant metaphor: a single plant in a pot with `total` leaves
 * arranged along a curving stem. Completed days are filled, today's leaf
 * pulses gold and grows with task completion. After half-way, a small flower
 * crown blooms.
 */
export default function ProgressPlant({ day, total, todayCompletion }: ProgressPlantProps) {
  const leaves = Array.from({ length: total }, (_, i) => {
    const t = (i + 1) / (total + 1);
    const y = 270 - t * 220;
    const side = i % 2 === 0 ? -1 : 1;
    const stemX = 130 + Math.sin(t * Math.PI * 1.2) * 6;
    const angle = side * (28 + Math.sin(t * Math.PI) * 14);
    const len = 24 + Math.sin(t * Math.PI) * 16;
    return { x: stemX, y, angle, len };
  });

  const stemPath = (() => {
    let d = 'M 130 290';
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const yy = 290 - t * 240;
      const xx = 130 + Math.sin(t * Math.PI * 1.2) * 6;
      d += ` L ${xx.toFixed(1)} ${yy.toFixed(1)}`;
    }
    return d;
  })();

  const todayIndex = day - 1;
  const halfway = day > total / 2;

  return (
    <div
      className="relative w-full h-full min-h-[360px] rounded-3xl bg-forest-900/40 overflow-hidden"
      aria-label={`Pyebwa pwogrè — jou ${day} sou ${total}`}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(231, 142, 23,0.25) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <svg viewBox="0 0 260 320" className="relative z-10 w-full h-full">
        <defs>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93b031" />
            <stop offset="100%" stopColor="#435b12" />
          </linearGradient>
          <linearGradient id="leafGoldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eeac41" />
            <stop offset="100%" stopColor="#c1750f" />
          </linearGradient>
          <radialGradient id="potGrad" cx="0.5" cy="0.2">
            <stop offset="0%" stopColor="#eeac41" />
            <stop offset="100%" stopColor="#985c0c" />
          </radialGradient>
        </defs>

        {/* Soil */}
        <ellipse cx="130" cy="290" rx="44" ry="6" fill="#3A2218" opacity="0.55" />

        {/* Pot */}
        <path
          d="M 88 286 L 92 318 Q 92 320 94 320 L 166 320 Q 168 320 168 318 L 172 286 Z"
          fill="url(#potGrad)"
        />
        <path d="M 84 282 L 176 282 L 173 290 L 87 290 Z" fill="#c1750f" />
        <text
          x="130"
          y="306"
          fontFamily="var(--font-lora), serif"
          fontStyle="italic"
          fontSize="9"
          fill="#3D2F07"
          textAnchor="middle"
          opacity="0.6"
        >
          hois plan
        </text>

        {/* Stem */}
        <path
          d={stemPath}
          stroke="#435b12"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Leaves */}
        {leaves.map((leaf, i) => {
          const completed = i < day - 1;
          const isToday = i === todayIndex;
          const todayScale = isToday ? 0.35 + todayCompletion * 0.65 : 1;
          const opacity = completed
            ? 1
            : isToday
            ? 0.55 + todayCompletion * 0.45
            : 0.25;
          const fill = isToday
            ? 'url(#leafGoldGrad)'
            : completed
            ? 'url(#leafGrad)'
            : 'none';
          const stroke = completed ? '#33450e' : isToday ? '#e78e17' : '#93b031';

          return (
            <g
              key={i}
              transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle}) scale(${todayScale})`}
              style={{
                transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease',
              }}
            >
              <path
                d={`M 0 0 Q ${leaf.len * 0.4} ${-leaf.len * 0.45} ${leaf.len} 0 Q ${
                  leaf.len * 0.4
                } ${leaf.len * 0.45} 0 0 Z`}
                fill={fill}
                stroke={stroke}
                strokeWidth={isToday ? 1.4 : 1}
                opacity={opacity}
              />
              {completed && (
                <line
                  x1="2"
                  y1="0"
                  x2={leaf.len - 2}
                  y2="0"
                  stroke="#33450e"
                  strokeWidth="0.6"
                  opacity="0.4"
                />
              )}
              {isToday && (
                <circle cx="0" cy="0" r="3" fill="#e78e17">
                  <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="1;0.4;1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Crown flower after halfway */}
        {halfway && (
          <g
            transform="translate(130, 46)"
            opacity={Math.min(1, (day - total / 2) / 8)}
          >
            <circle r="6" fill="url(#leafGoldGrad)" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-8"
                rx="3"
                ry="6"
                fill="#e78e17"
                transform={`rotate(${a})`}
                opacity="0.9"
              />
            ))}
            <circle r="3" fill="#5C3D2E" />
          </g>
        )}

        {/* Day counter */}
        <g transform="translate(226, 36)" textAnchor="end">
          <text
            fontFamily="var(--font-playfair), serif"
            fontSize="34"
            fontWeight="700"
            fill="#eeac41"
            textAnchor="end"
          >
            {day}
            <tspan fontSize="14" fill="rgba(250,246,237,0.65)" fontWeight="500">
              /{total}
            </tspan>
          </text>
          <text
            y="14"
            fontFamily="var(--font-dm-sans), sans-serif"
            fontSize="9"
            fill="rgba(250,246,237,0.65)"
            letterSpacing="2"
            textAnchor="end"
          >
            JOU PLAN AN
          </text>
        </g>
      </svg>
    </div>
  );
}
