/**
 * Dashboard personalization core (server-safe — no React, no client deps).
 *
 * The /dashboard page builds a DashboardContext from the member's profile
 * + data, then asks orderedBlocks() which blocks to render and in what
 * order. This is the "B + A" model:
 *   • B (modular): blocks show/hide and reorder by who the member is and
 *     where they are in their journey.
 *   • A (smart metrics): resolvePrimaryMetric() picks the one health
 *     metric that matters most for this member's condition/goal.
 */

export type PrimaryMetric = 'blood_sugar' | 'pressure' | 'weight';
export type Lifecycle = 'new' | 'active' | 'established';
export type Plan = 'basic' | 'premium' | 'vip';

export type BlockId =
  | 'onboarding'
  | 'hero'
  | 'hois'
  | 'metrics'
  | 'checklist'
  | 'treatments'
  | 'remed'
  | 'badges'
  | 'downloads'
  | 'upsell';

export type DashboardContext = {
  plan: Plan;
  conditions: string[];
  healthGoal: string | null;
  /** The single metric to spotlight, or null when none is relevant
   *  (e.g. a purely spiritual member with no tracked condition). */
  primaryMetric: PrimaryMetric | null;
  lifecycle: Lifecycle;
  isSpiritual: boolean;
  hasProgram: boolean;
  hasTreatments: boolean;
  /** Real (non-fallback) health-log count — drives lifecycle + honest
   *  empty states instead of fake sparklines. */
  realLogCount: number;
  streak: number;
};

// ── Condition / goal → metric mapping ───────────────────────────────────
// Conditions win first (a diagnosed condition is more specific than a
// goal). Falls back to the health goal when no condition maps.
const CONDITION_METRIC: Record<string, PrimaryMetric> = {
  diabetes_type_1: 'blood_sugar',
  diabetes_type_2: 'blood_sugar',
  hypertension: 'pressure',
  hypotension: 'pressure',
  cholesterol: 'weight',
};

const GOAL_METRIC: Record<string, PrimaryMetric> = {
  manage_diabetes: 'blood_sugar',
  manage_hypertension: 'pressure',
  lose_weight: 'weight',
  gain_weight: 'weight',
};

// ── Profile → Remèd Finder condition slugs ───────────────────────────────
// Bridges the member's medical-profile slugs (user_medical_info.conditions,
// as written by the settings form) and their health_goal onto the Remèd
// Finder `conditions` table slugs (migration 078 seed). Used by the
// dashboard's "Remèd pou ou" block to pull personalized product
// recommendations from the same dataset the floating widget searches.
const PROFILE_CONDITION_TO_REMED: Record<string, string> = {
  diabetes: 'dyabet',
  diabetes_type_1: 'dyabet',
  diabetes_type_2: 'dyabet',
  hypertension: 'tansyon-wo',
  hypotension: 'sikilasyon',
  heart: 'sikilasyon',
  anemia: 'sikilasyon',
  asthma: 'respirasyon',
  arthritis: 'doule-enflamasyon',
  migraine: 'doule-enflamasyon',
  cholesterol: 'cholesterol',
  thyroid: 'tiwoyid',
  kidney: 'ren-pipi',
  liver: 'fwa-epatit',
  gastric: 'dijesyon',
  digestive: 'dijesyon',
  depression: 'estres-somey',
  anxiety: 'estres-somey',
  insomnia: 'estres-somey',
  menstrual: 'doule-reg',
  fertility: 'fetilite',
  obesity: 'pedi-pwa',
};

const GOAL_TO_REMED: Record<string, string> = {
  manage_diabetes: 'dyabet',
  manage_hypertension: 'tansyon-wo',
  lose_weight: 'pedi-pwa',
  gain_weight: 'eneji',
  spiritual_balance: 'estres-somey',
  general_wellness: 'iminite',
  detox: 'detoks',
  fertility: 'fetilite',
};

/**
 * Resolve the member's profile into Remèd Finder condition slugs,
 * deduplicated, conditions first (more specific than the goal). Empty
 * array = nothing to recommend, the block hides itself.
 */
export function remedSlugsFor(
  conditions: string[],
  healthGoal: string | null
): string[] {
  const out: string[] = [];
  for (const c of conditions) {
    const slug = PROFILE_CONDITION_TO_REMED[c];
    if (slug && !out.includes(slug)) out.push(slug);
  }
  if (healthGoal) {
    const slug = GOAL_TO_REMED[healthGoal];
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

export function resolvePrimaryMetric(
  conditions: string[],
  healthGoal: string | null
): PrimaryMetric | null {
  for (const c of conditions) {
    if (CONDITION_METRIC[c]) return CONDITION_METRIC[c];
  }
  if (healthGoal && GOAL_METRIC[healthGoal]) return GOAL_METRIC[healthGoal];
  return null;
}

// ── Lifecycle ────────────────────────────────────────────────────────────
// "new"        — just joined OR has never logged anything real
// "active"     — logging + keeping at least a short streak
// "established"— around a while with real history
export function resolveLifecycle(input: {
  accountAgeDays: number;
  realLogCount: number;
  streak: number;
}): Lifecycle {
  const { accountAgeDays, realLogCount, streak } = input;
  if (realLogCount === 0 || accountAgeDays < 3) return 'new';
  if (streak >= 3 || realLogCount >= 5) return 'active';
  return 'established';
}

export function buildDashboardContext(input: {
  plan: Plan;
  conditions: string[];
  healthGoal: string | null;
  accountAgeDays: number;
  realLogCount: number;
  streak: number;
  hasProgram: boolean;
  hasTreatments: boolean;
}): DashboardContext {
  const lifecycle = resolveLifecycle({
    accountAgeDays: input.accountAgeDays,
    realLogCount: input.realLogCount,
    streak: input.streak,
  });
  return {
    plan: input.plan,
    conditions: input.conditions,
    healthGoal: input.healthGoal,
    primaryMetric: resolvePrimaryMetric(input.conditions, input.healthGoal),
    lifecycle,
    isSpiritual: input.healthGoal === 'spiritual_balance',
    hasProgram: input.hasProgram,
    hasTreatments: input.hasTreatments,
    realLogCount: input.realLogCount,
    streak: input.streak,
  };
}

// ── Block ordering ────────────────────────────────────────────────────────
// Lower weight = higher on the page. Weights shift with context so the
// most relevant block leads. Hidden blocks are dropped entirely.
export function orderedBlocks(ctx: DashboardContext): BlockId[] {
  const plan: { id: BlockId; show: boolean; weight: number }[] = [
    // New members lead with onboarding, never with charts.
    { id: 'onboarding', show: ctx.lifecycle === 'new', weight: 5 },

    { id: 'hero', show: true, weight: 10 },

    // Spiritual members (or VIPs) get the HOÏS reflection high up; for
    // everyone else it sinks toward the bottom as a "nice to have".
    {
      id: 'hois',
      show: ctx.isSpiritual || ctx.plan === 'vip',
      weight: ctx.isSpiritual ? 14 : 46,
    },

    // Metrics only when there's a metric worth spotlighting, and we don't
    // bury a brand-new member in numbers before they've logged.
    {
      id: 'metrics',
      show: ctx.primaryMetric !== null && ctx.lifecycle !== 'new',
      weight: 20,
    },

    { id: 'checklist', show: ctx.hasProgram, weight: 30 },
    { id: 'treatments', show: ctx.hasTreatments, weight: 35 },

    // Personalized shop recommendations — only when the member's
    // conditions/goal actually map onto the Remèd Finder dataset.
    {
      id: 'remed',
      show: remedSlugsFor(ctx.conditions, ctx.healthGoal).length > 0,
      weight: 38,
    },

    // Badges reward engaged members; hide for brand-new to reduce clutter.
    { id: 'badges', show: ctx.lifecycle !== 'new', weight: 50 },

    { id: 'downloads', show: true, weight: 60 },

    // No upsell to people already on the top plan.
    { id: 'upsell', show: ctx.plan !== 'vip', weight: 80 },
  ];

  return plan
    .filter((b) => b.show)
    .sort((a, b) => a.weight - b.weight)
    .map((b) => b.id);
}
