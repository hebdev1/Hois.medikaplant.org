// Brand logo mark for MedikaPlant / Hoïs Inivèsite.
// Pure SVG so it scales crisply and ships with zero asset weight
// (no PNG/JPG in /public to serve). Uses the brand's forest gradient
// as the background with a stylized leaf blade + gold accent dot.
// Sized via a single `size` prop so the caller controls container
// dimensions consistently — the outer <rect> inherits it via
// the SVG viewBox.

type BrandLogoProps = {
  /** Rendered pixel dimensions (square). Default 36. */
  size?: number;
  /**
   * Rounded-corner radius as a fraction of size. Default 0.28 gives
   * roughly rounded-xl at 36px.
   */
  radius?: number;
  className?: string;
  /**
   * Optional aria-label. Falls back to a generic mark description
   * so screen readers announce something meaningful.
   */
  label?: string;
};

export default function BrandLogo({
  size = 36,
  radius = 0.28,
  className,
  label = 'MedikaPlant · Hoïs Inivèsite',
}: BrandLogoProps) {
  const r = 40 * radius;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <linearGradient
          id="mp-brand-bg"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#5a9138" />
          <stop offset="100%" stopColor="#1e3a0f" />
        </linearGradient>
        <linearGradient id="mp-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3f8ef" />
          <stop offset="100%" stopColor="#cce3bd" />
        </linearGradient>
      </defs>

      {/* Rounded brand tile */}
      <rect width="40" height="40" rx={r} fill="url(#mp-brand-bg)" />

      {/* Subtle inner glow ring */}
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx={r - 1.5}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Leaf blade — oriented diagonally like a willow/olive leaf,
          two smooth curves meeting at top-right and bottom-left. */}
      <path
        d="M12 27 Q 11 12 27 12 Q 30 14 30 19 Q 30 30 15 30 Q 12 30 12 27 Z"
        fill="url(#mp-leaf)"
      />

      {/* Central vein (midrib) — a soft dark line through the leaf */}
      <path
        d="M13 28 Q 20 20 28 13"
        stroke="#1e3a0f"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* Two small side veins for depth */}
      <path
        d="M17 24 Q 20 22 23 20"
        stroke="#1e3a0f"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M20 27 Q 23 24 26 22"
        stroke="#1e3a0f"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />

      {/* Gold accent dot — the "Hoïs" mark. Sits off the leaf tip
          like a small berry / drop of gold sun. */}
      <circle cx="30.5" cy="9.5" r="2.4" fill="#c9a227" />
      <circle cx="30.5" cy="9.5" r="2.4" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
    </svg>
  );
}
