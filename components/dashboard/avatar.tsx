type AvatarProps = {
  size?: number;
  bordered?: boolean;
};

/**
 * Illustrated portrait avatar — gradient sky background with hair/face/shoulders.
 * Pure SVG so it scales crisply and ships with zero asset weight.
 */
export default function Avatar({ size = 38, bordered = false }: AvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      style={{
        borderRadius: '50%',
        display: 'block',
        boxShadow: bordered ? '0 0 0 2px var(--brand-primary, #5a9138)' : 'none',
      }}
    >
      <defs>
        <linearGradient id="avBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7AAF52" />
          <stop offset="100%" stopColor="#2D5A1B" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" fill="url(#avBg)" />
      <path
        d="M 8 80 C 14 60 26 56 40 56 C 54 56 66 60 72 80 Z"
        fill="#C9A227"
      />
      <path
        d="M 30 56 C 30 58 34 62 40 62 C 46 62 50 58 50 56 Z"
        fill="#A07B6A"
      />
      <rect x="34" y="50" width="12" height="10" rx="3" fill="#8E6552" />
      <ellipse cx="40" cy="40" rx="14" ry="16" fill="#A07B6A" />
      <path
        d="M 22 36 C 20 24 28 16 40 16 C 52 16 60 24 58 36 C 58 30 54 27 50 27 C 46 27 44 30 40 30 C 36 30 34 27 30 27 C 26 27 22 30 22 36 Z"
        fill="#3A2218"
      />
      <circle cx="26" cy="32" r="3.5" fill="#3A2218" />
      <circle cx="32" cy="26" r="3.5" fill="#3A2218" />
      <circle cx="40" cy="22" r="4" fill="#3A2218" />
      <circle cx="48" cy="26" r="3.5" fill="#3A2218" />
      <circle cx="54" cy="32" r="3.5" fill="#3A2218" />
      <circle cx="26" cy="44" r="1.5" fill="#C9A227" />
      <circle cx="54" cy="44" r="1.5" fill="#C9A227" />
      <ellipse cx="34" cy="40" rx="1.4" ry="1.8" fill="#1A1A1A" />
      <ellipse cx="46" cy="40" rx="1.4" ry="1.8" fill="#1A1A1A" />
      <path
        d="M 30 35 Q 34 33 38 35"
        stroke="#3A2218"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 42 35 Q 46 33 50 35"
        stroke="#3A2218"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 35 47 Q 40 50 45 47"
        stroke="#5C2D24"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 56 30 Q 62 26 60 22 Q 58 24 56 28 Z" fill="#7AAF52" />
    </svg>
  );
}
