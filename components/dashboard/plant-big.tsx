import type { Database } from '@/types/database';

type GuideArt = Database['public']['Enums']['guide_art'];

type PlantBigProps = {
  art?: GuideArt;
  accent?: string;
  opacity?: number;
  size?: number;
};

/**
 * Decorative botanical glyph that fills a card's art area. Six variants:
 * leaf (central palmate), sprout (twin shoots), droplet (water with leaf),
 * sparkle (radial energy), tree (trunk + canopy), flower (5-petal bloom).
 * Used by both the featured hero and the article grid cards.
 */
export default function PlantBig({
  art = 'leaf',
  accent = '#93b031',
  opacity = 0.85,
  size = 200,
}: PlantBigProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      style={{ opacity }}
      aria-hidden
    >
      <ellipse cx="100" cy="172" rx="62" ry="6" fill="rgba(0,0,0,0.18)" />
      {renderShape(art, accent)}
    </svg>
  );
}

function renderShape(art: GuideArt, accent: string) {
  switch (art) {
    case 'leaf':
      return (
        <g>
          <path
            d="M100 28C66 60 56 110 72 152C84 168 96 172 100 172C104 172 116 168 128 152C144 110 134 60 100 28Z"
            fill={accent}
          />
          <path
            d="M100 28C112 70 108 124 100 172"
            stroke="#FFFDF8"
            strokeWidth="2.2"
            opacity="0.45"
          />
          <path
            d="M58 96C36 84 22 100 32 118C52 116 64 106 58 96Z"
            fill={accent}
            opacity="0.78"
          />
          <path
            d="M142 96C164 84 178 100 168 118C148 116 136 106 142 96Z"
            fill={accent}
            opacity="0.78"
          />
        </g>
      );
    case 'sprout':
      return (
        <g>
          <rect x="92" y="120" width="16" height="50" rx="6" fill="#5C3D2E" />
          <path
            d="M100 122C72 110 54 80 64 60C92 64 110 90 100 122Z"
            fill={accent}
            opacity="0.92"
          />
          <path
            d="M100 122C128 110 146 80 136 60C108 64 90 90 100 122Z"
            fill={accent}
          />
          <path
            d="M100 122C84 100 80 70 92 50C108 60 116 92 100 122Z"
            stroke="#FFFDF8"
            strokeWidth="2"
            opacity="0.5"
            fill="none"
          />
          <circle cx="100" cy="160" r="22" fill="rgba(0,0,0,0.12)" />
        </g>
      );
    case 'droplet':
      return (
        <g>
          <path
            d="M100 26C70 58 56 96 56 122C56 154 76 174 100 174C124 174 144 154 144 122C144 96 130 58 100 26Z"
            fill={accent}
          />
          <path
            d="M88 96C80 110 76 124 80 138"
            stroke="#FFFDF8"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M60 144C70 132 86 130 100 138"
            stroke={accent}
            strokeWidth="3"
            opacity="0.6"
          />
        </g>
      );
    case 'sparkle':
      return (
        <g>
          <circle cx="100" cy="100" r="14" fill={accent} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <g
              key={angle}
              transform={`translate(100,100) rotate(${angle})`}
              opacity={i % 2 === 0 ? 1 : 0.7}
            >
              <path
                d={`M0 ${-22} L8 ${-50} L0 ${-90} L-8 ${-50} Z`}
                fill={accent}
              />
            </g>
          ))}
          <circle cx="100" cy="100" r="6" fill="#FFFDF8" opacity="0.85" />
        </g>
      );
    case 'tree':
      return (
        <g>
          <rect x="92" y="120" width="16" height="50" rx="4" fill="#5C3D2E" />
          <circle cx="100" cy="80" r="42" fill={accent} />
          <circle cx="68" cy="98" r="28" fill={accent} opacity="0.85" />
          <circle cx="132" cy="98" r="28" fill={accent} opacity="0.85" />
          <circle cx="100" cy="50" r="22" fill={accent} opacity="0.9" />
          <path
            d="M100 80C100 100 100 120 100 168"
            stroke="#FFFDF8"
            strokeWidth="2"
            opacity="0.4"
          />
        </g>
      );
    case 'flower':
      return (
        <g>
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`translate(100,96) rotate(${angle})`}>
              <ellipse
                cx="0"
                cy="-40"
                rx="22"
                ry="36"
                fill={accent}
                opacity="0.92"
              />
            </g>
          ))}
          <circle cx="100" cy="96" r="20" fill="#FFFDF8" opacity="0.95" />
          <circle cx="100" cy="96" r="10" fill={accent} />
          <rect x="96" y="116" width="8" height="56" rx="4" fill="#3D7222" />
          <path
            d="M104 140C124 140 134 130 132 118C118 122 108 130 104 140Z"
            fill={accent}
            opacity="0.85"
          />
        </g>
      );
  }
}
