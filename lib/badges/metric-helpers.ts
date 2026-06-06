// ───────────────────────────────────────────────────────────────────────────
// Per-metric copy used by the badge gallery + detail pages.
// Keep these strings here (single source of truth) so the gallery and the
// detail page always show the same label/unit/tip for the same criteria.
// ───────────────────────────────────────────────────────────────────────────

export type BadgeMetric =
  | 'streak_days'
  | 'tisane_count'
  | 'hydration_days'
  | 'movement_days'
  | 'glycemia_in_range'
  | 'program_day'
  | 'level'
  | 'tasks_done';

/** Short Kreyòl label that goes next to the number ("Jou seri: 7"). */
export const METRIC_LABEL: Record<BadgeMetric, string> = {
  streak_days: 'Jou seri',
  tisane_count: 'Tas tizan pran',
  hydration_days: 'Jou idratasyon',
  movement_days: 'Jou mouvman',
  glycemia_in_range: 'Mezi nan zòn',
  program_day: 'Jou nan pwogram',
  level: 'Nivo manm',
  tasks_done: 'Tach konplete',
};

/** Unit displayed after the value ("7 jou", "30 fwa"). Empty for 'level'. */
export const METRIC_UNIT: Record<BadgeMetric, string> = {
  streak_days: 'jou',
  tisane_count: 'fwa',
  hydration_days: 'jou',
  movement_days: 'jou',
  glycemia_in_range: 'mezi',
  program_day: 'jou',
  level: '',
  tasks_done: 'tach',
};

/** A one-sentence tip + a CTA telling the user where to act on it. */
export const METRIC_TIP: Record<
  BadgeMetric,
  { text: string; linkLabel: string; href: string }
> = {
  streak_days: {
    text: 'Konekte chak jou epi konplete omwen yon tach pou streak la kontinye monte.',
    linkLabel: 'Plan jou a',
    href: '/dashboard',
  },
  tisane_count: {
    text: 'Pran tizan ki nan plan ou chak jou, epi make tach "Tizan" kòm konplete.',
    linkLabel: 'Plan mwen yo',
    href: '/dashboard/programs',
  },
  hydration_days: {
    text: 'Bwè omwen 2L dlo pa jou epi make tach "Idratasyon" an chak jou diferan.',
    linkLabel: 'Plan mwen yo',
    href: '/dashboard/programs',
  },
  movement_days: {
    text: 'Mache, etire, oswa bouje 30 minit. Make tach "Mouvman" an chak jou.',
    linkLabel: 'Plan mwen yo',
    href: '/dashboard/programs',
  },
  glycemia_in_range: {
    text: 'Loge mezi glikemi ou souvan. Sèl mezi ki tonbe nan zòn 70–130 mg/dL k ap konte.',
    linkLabel: 'Loge yon mezi',
    href: '/dashboard/health',
  },
  program_day: {
    text: 'Kontinye angaje w nan pwogram aktif la — chak jou ki pase ajoute nan total ou.',
    linkLabel: 'Wè pwogram nan',
    href: '/dashboard/programs',
  },
  level: {
    text: 'Debloke lòt badj pou monte nivo. Chak badj otomatik ajoute +1 nan nivo w.',
    linkLabel: 'Wè tout badj',
    href: '/dashboard/badges',
  },
  tasks_done: {
    text: 'Konplete tach jou yo nan plan w. Yo otomatik konte.',
    linkLabel: 'Plan mwen yo',
    href: '/dashboard/programs',
  },
};

/**
 * Narrowing helper — incoming criteria_metric from DB is a free-form string.
 * Anything not in the known set falls back to 'tasks_done'.
 */
export function asBadgeMetric(raw: string): BadgeMetric {
  const known: BadgeMetric[] = [
    'streak_days',
    'tisane_count',
    'hydration_days',
    'movement_days',
    'glycemia_in_range',
    'program_day',
    'level',
    'tasks_done',
  ];
  return (known as string[]).includes(raw) ? (raw as BadgeMetric) : 'tasks_done';
}

/** Same icon allowlist used by BadgeArt + the dashboard panel. */
export type BadgeIconName =
  | 'sprout'
  | 'leaf'
  | 'droplet'
  | 'flame'
  | 'activity'
  | 'target'
  | 'calendar'
  | 'star';

export function asBadgeIcon(raw: string): BadgeIconName {
  const known: BadgeIconName[] = [
    'sprout',
    'leaf',
    'droplet',
    'flame',
    'activity',
    'target',
    'calendar',
    'star',
  ];
  return (known as string[]).includes(raw) ? (raw as BadgeIconName) : 'star';
}
