type RadialProps = {
  value: number; // 0..100
  size?: number;
};

export default function Radial({ value, size = 84 }: RadialProps) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - Math.max(0, Math.min(100, value)) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="radialGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e78e17" />
            <stop offset="100%" stopColor="#65881a" />
          </linearGradient>
        </defs>
        <circle
          cx="42"
          cy="42"
          r={r}
          stroke="#eaefce"
          strokeWidth="7"
          fill="none"
        />
        <circle
          cx="42"
          cy="42"
          r={r}
          stroke="url(#radialGradient)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-bold text-ink text-base">
        {Math.round(value)}%
      </div>
    </div>
  );
}
