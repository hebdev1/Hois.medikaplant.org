// ───────────────────────────────────────────────────────────────────────────
// Condition catalog — single source of truth for the slug ↔ display label
// mapping used by the admin segments page, the program/advice tag editor,
// and the dashboard's condition-aware filtering.
//
// Add a row here, restart, and the value shows up in every tag picker and
// every segment row automatically. We keep this in code (not the DB) so
// the label is type-safe and translatable — the DB just stores the slug.
// ───────────────────────────────────────────────────────────────────────────

export type ConditionGroup = 'metabolic' | 'cardio' | 'mental' | 'respiratory' | 'other';

export type ConditionEntry = {
  slug: string;
  label: string;          // Kreyòl display name
  group: ConditionGroup;
  /** Emoji used in segment cards + tag chips for quick visual scanning. */
  icon: string;
};

export const CONDITION_CATALOG: ConditionEntry[] = [
  // ── Metabolic ─────────────────────────────────────────────────────────
  { slug: 'diabetes',        label: 'Dyabèt',                 group: 'metabolic',  icon: '🩸' },
  { slug: 'diabetes_type_1', label: 'Dyabèt tip 1',           group: 'metabolic',  icon: '🩸' },
  { slug: 'diabetes_type_2', label: 'Dyabèt tip 2',           group: 'metabolic',  icon: '🩸' },
  { slug: 'cholesterol',     label: 'Kolestewòl',             group: 'metabolic',  icon: '🟡' },
  { slug: 'obesity',         label: 'Pwa anplis',             group: 'metabolic',  icon: '⚖️' },
  // ── Cardiovascular ───────────────────────────────────────────────────
  { slug: 'hypertension',    label: 'Tansyon wo',             group: 'cardio',     icon: '❤️' },
  { slug: 'hypotension',     label: 'Tansyon ba',             group: 'cardio',     icon: '💙' },
  { slug: 'heart',           label: 'Pwoblèm kè',             group: 'cardio',     icon: '🫀' },
  // ── Mental / sleep ───────────────────────────────────────────────────
  { slug: 'insomnia',        label: 'Pa ka dòmi',             group: 'mental',     icon: '😴' },
  { slug: 'anxiety',         label: 'Estrès / anksyete',      group: 'mental',     icon: '🌀' },
  { slug: 'depression',      label: 'Depresyon',              group: 'mental',     icon: '🌧️' },
  // ── Respiratory ──────────────────────────────────────────────────────
  { slug: 'asthma',          label: 'Asmatik',                group: 'respiratory', icon: '🫁' },
  // ── Other ────────────────────────────────────────────────────────────
  { slug: 'anemia',          label: 'Anemi',                  group: 'other',      icon: '🩸' },
  { slug: 'kidney',          label: 'Pwoblèm ren',            group: 'other',      icon: '🟤' },
  { slug: 'liver',           label: 'Pwoblèm fwa',            group: 'other',      icon: '🟤' },
  { slug: 'digestive',       label: 'Dijesyon difisil',       group: 'other',      icon: '🍵' },
  { slug: 'menstrual',       label: 'Doulè règ',              group: 'other',      icon: '🌸' },
  { slug: 'fertility',       label: 'Fètilite',               group: 'other',      icon: '🌱' },
];

export const CONDITION_GROUP_LABEL: Record<ConditionGroup, string> = {
  metabolic:   'Metabolik',
  cardio:      'Kè + Tansyon',
  mental:      'Mantal + Dòmi',
  respiratory: 'Respirasyon',
  other:       'Lòt',
};

const BY_SLUG = new Map(CONDITION_CATALOG.map((c) => [c.slug, c]));

/**
 * Resolve a slug to its label + icon. For free-form values the user
 * typed themselves (anything not in the catalog), fall back to a
 * title-cased version of the slug + a neutral icon. Always returns
 * something — callers don't need to null-check.
 */
export function describeCondition(slug: string): ConditionEntry {
  const known = BY_SLUG.get(slug);
  if (known) return known;
  // Free-form entries: prettify what the user typed.
  const pretty = slug
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return {
    slug,
    label: pretty || slug,
    group: 'other',
    icon: '🌿',
  };
}

/**
 * Stable sort key for segment lists — known catalog entries sort by
 * (group rank, label), and free-form entries land at the end so curated
 * conditions surface first.
 */
const GROUP_ORDER: ConditionGroup[] = [
  'metabolic',
  'cardio',
  'respiratory',
  'mental',
  'other',
];

export function compareConditionSlug(a: string, b: string): number {
  const A = describeCondition(a);
  const B = describeCondition(b);
  const aKnown = BY_SLUG.has(a) ? 0 : 1;
  const bKnown = BY_SLUG.has(b) ? 0 : 1;
  if (aKnown !== bKnown) return aKnown - bKnown;
  const ag = GROUP_ORDER.indexOf(A.group);
  const bg = GROUP_ORDER.indexOf(B.group);
  if (ag !== bg) return ag - bg;
  return A.label.localeCompare(B.label);
}
