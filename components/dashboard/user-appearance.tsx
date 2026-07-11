'use client';

import { useEffect } from 'react';
import type { Database } from '@/types/database';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

type Props = {
  prefs: Pick<
    PrefRow,
    | 'accent'
    | 'density'
    | 'dark_mode'
    | 'font_size'
    | 'font_scale'
    | 'reduced_motion'
    | 'high_contrast'
    | 'card_radius'
    | 'language'
  >;
  children: React.ReactNode;
};

// Discrete font-size scale used when font_scale is set. Stored as a single
// CSS pixel value on documentElement so root rem-based components react.
const SCALE_PX: Record<string, number> = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
};

const ACCENT_VARS: Record<
  string,
  { primary: string; primaryFg: string; primarySoft: string }
> = {
  forest: {
    primary: '#547216',
    primaryFg: '#fefcf6',
    primarySoft: '#eaefce',
  },
  gold: {
    primary: '#e78e17',
    primaryFg: '#33450e',
    primarySoft: '#fbe4bb',
  },
  // 'both' = brand-default. Pink accent + forest primary.
  both: {
    primary: '#547216',
    primaryFg: '#fefcf6',
    primarySoft: '#eaefce',
  },
};

/**
 * UserAppearance — turns the user_preferences row into real CSS state.
 *
 * Sits in app/dashboard/layout.tsx wrapping the dashboard tree. It is a
 * client component on purpose so we can mutate documentElement once on
 * mount + after every server-revalidation that ships a new prefs prop.
 *
 * We write to documentElement (not body) so that any descendant can use
 * `[data-density="compact"] .gap-y-2` selectors and so the dark class
 * cascades through Tailwind's `.dark` variant.
 */
export default function UserAppearance({ prefs, children }: Props) {
  useEffect(() => {
    const root = document.documentElement;

    // ── Dark mode ───────────────────────────────────────────────────────
    root.classList.toggle('dark', prefs.dark_mode === true);

    // ── Reduce motion ──────────────────────────────────────────────────
    root.classList.toggle('reduce-motion', prefs.reduced_motion === true);

    // ── High contrast ──────────────────────────────────────────────────
    root.classList.toggle('high-contrast', prefs.high_contrast === true);

    // ── Discrete density / radius — read by globals.css selectors ──────
    root.setAttribute('data-density', prefs.density || 'regular');
    root.setAttribute('data-radius', prefs.card_radius || 'rounded');
    root.setAttribute('data-accent', prefs.accent || 'both');
    root.setAttribute('data-lang', prefs.language || 'ht');

    // ── Font size: precise px wins, otherwise discrete scale ───────────
    const px =
      typeof prefs.font_size === 'number' && prefs.font_size > 0
        ? prefs.font_size
        : SCALE_PX[prefs.font_scale] ?? SCALE_PX.medium;
    root.style.setProperty('--ui-font-size', `${px}px`);

    // ── Accent CSS vars ────────────────────────────────────────────────
    const vars = ACCENT_VARS[prefs.accent] ?? ACCENT_VARS.both;
    root.style.setProperty('--ui-accent', vars.primary);
    root.style.setProperty('--ui-accent-fg', vars.primaryFg);
    root.style.setProperty('--ui-accent-soft', vars.primarySoft);
  }, [
    prefs.dark_mode,
    prefs.reduced_motion,
    prefs.high_contrast,
    prefs.density,
    prefs.card_radius,
    prefs.accent,
    prefs.language,
    prefs.font_size,
    prefs.font_scale,
  ]);

  return <>{children}</>;
}
