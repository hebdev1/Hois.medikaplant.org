type BadgeArtProps = {
  icon: 'sprout' | 'leaf' | 'droplet' | 'flame' | 'activity' | 'target' | 'calendar' | 'star';
  unlocked: boolean;
};

/**
 * Medallion-style badge artwork. Locked badges show a small padlock at the
 * bottom; unlocked badges grow gold ribbons on either side.
 */
export default function BadgeArt({ icon, unlocked }: BadgeArtProps) {
  const main = unlocked ? '#C9A227' : '#CFC09A';
  const dark = unlocked ? '#856915' : '#8A8A8A';

  return (
    <svg viewBox="0 0 56 56" width="42" height="42">
      <circle
        cx="28"
        cy="28"
        r="22"
        fill={unlocked ? '#FDF8E7' : '#F4F4F4'}
        stroke={main}
        strokeWidth="1.5"
      />
      <circle
        cx="28"
        cy="28"
        r="18"
        fill="none"
        stroke={main}
        strokeWidth="0.8"
        strokeDasharray="2 2"
        opacity="0.6"
      />
      <g
        transform="translate(28 28)"
        stroke={dark}
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon === 'sprout' && (
          <g>
            <path d="M0 8V-2" />
            <path
              d="M0 -2C0 -5 -3 -6 -6 -5c0 3 3 5 6 3z"
              fill={main}
              fillOpacity="0.5"
            />
            <path
              d="M0 -2C0 -5 3 -6 6 -5c0 3 -3 5 -6 3z"
              fill={main}
              fillOpacity="0.5"
            />
            <line x1="-5" y1="8" x2="5" y2="8" />
          </g>
        )}
        {icon === 'leaf' && (
          <path
            d="M8 -8S2 -8 -3 -3s-3 9 -3 9 6 0 9 -3 -3 -11 5 -11z"
            fill={main}
            fillOpacity="0.5"
          />
        )}
        {icon === 'droplet' && (
          <path
            d="M0 -8c4 4 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2-6.6 6-10.6z"
            fill={main}
            fillOpacity="0.5"
          />
        )}
        {icon === 'flame' && (
          <g>
            <path
              d="M0 8c-3 0-5-2-5-4 0-3 4-4 3-8 0-1 4 2 5 7-1 2-3 5-3 5z"
              fill={main}
              fillOpacity="0.5"
            />
            <path d="M4 4c0-3-2-5-2-5" />
          </g>
        )}
        {icon === 'activity' && <path d="M-10 0h4l3-7 6 14 3-7h4" />}
        {icon === 'target' && (
          <g>
            <circle r="9" fill="none" />
            <circle r="5" fill="none" />
            <circle r="1.5" fill={main} stroke="none" />
          </g>
        )}
        {icon === 'calendar' && (
          <g>
            <rect x="-8" y="-6" width="16" height="14" rx="2" fill="none" />
            <line x1="-8" y1="-1" x2="8" y2="-1" />
            <line x1="-3" y1="-9" x2="-3" y2="-3" />
            <line x1="3" y1="-9" x2="3" y2="-3" />
          </g>
        )}
        {icon === 'star' && (
          <polygon
            points="0 -9 2.5 -3 9 -2 4 2.5 5.5 9 0 6 -5.5 9 -4 2.5 -9 -2 -2.5 -3"
            fill={main}
            fillOpacity="0.5"
          />
        )}
      </g>
      {unlocked ? (
        <>
          <path d="M14 48 L20 56 L24 50 Z" fill={main} />
          <path d="M42 48 L36 56 L32 50 Z" fill={main} />
        </>
      ) : (
        <g transform="translate(28 40)">
          <rect x="-4" y="-2" width="8" height="7" rx="1.5" fill="#8A8A8A" />
          <path
            d="M-2.5 -2v-2a2.5 2.5 0 0 1 5 0v2"
            stroke="#8A8A8A"
            strokeWidth="1.2"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
