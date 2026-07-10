import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import BadgeArt from '@/components/dashboard/badge-art';
import {
  asBadgeIcon,
  asBadgeMetric,
  METRIC_LABEL,
  METRIC_UNIT,
  METRIC_TIP,
} from '@/lib/badges/metric-helpers';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

type BadgeRow = Database['public']['Tables']['badges']['Row'];
type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function formatHaitianDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatHaitianDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} · ${hh}h${mm}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('badges')
    .select('name')
    .eq('slug', params.slug)
    .maybeSingle();
  const name = (data as { name: string } | null)?.name;
  return { title: name ? `${name} · Badj` : 'Badj' };
}

export default async function BadgeDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch badge + user state in parallel.
  const [profileResult, badgeResult, unreadCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('badges')
      .select('*')
      .eq('slug', params.slug)
      .eq('active', true)
      .maybeSingle(),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const badge = (badgeResult.data ?? null) as BadgeRow | null;
  if (!badge) notFound();

  const profile = (profileResult.data ?? null) as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;

  // Per-user state for this specific badge + metric-specific recent activity.
  const metric = asBadgeMetric(badge.criteria_metric);
  const icon = asBadgeIcon(badge.icon);

  const [userBadgeResult, recentActivity] = await Promise.all([
    supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .eq('badge_id', badge.id)
      .maybeSingle(),
    fetchRecentActivity(supabase, user.id, metric),
  ]);

  const state = (userBadgeResult.data ?? null) as UserBadgeRow | null;
  const unlocked = state?.unlocked ?? false;
  const progress = state?.progress ? Number(state.progress) : 0;
  const currentValue = Math.round(progress * badge.criteria_threshold);
  const remaining = Math.max(0, badge.criteria_threshold - currentValue);
  const unit = METRIC_UNIT[metric];
  const tip = METRIC_TIP[metric];

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = PLAN_LABELS[profile?.plan ?? 'basic'] ?? 'Hoïs Bazilik';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1000px]">
        {/* Back nav */}
        <Link
          href="/dashboard/badges"
          className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 transition mb-5"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
          Tounen nan badj yo
        </Link>

        {/* ── Hero card ────────────────────────────────────────────────── */}
        <section
          className={`rounded-3xl border p-6 md:p-8 mb-6 md:mb-8 ${
            unlocked
              ? 'bg-gradient-to-br from-gold-50 via-cream-50 to-white border-gold-200'
              : 'bg-white border-cream-200'
          }`}
        >
          <div className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-start">
            {/* Big art */}
            <div className="flex justify-center md:justify-start">
              <div className="scale-[2.2] origin-center my-8">
                <BadgeArt icon={icon} unlocked={unlocked} />
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-cream-200 text-xs font-semibold mb-3">
                <Award className="w-3.5 h-3.5 text-gold-500" strokeWidth={2.2} />
                Badj #{badge.display_order}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink mb-2">
                {badge.name}
              </h1>
              {badge.sub && (
                <p className="text-sm text-earth-600 font-medium mb-4">
                  {badge.sub}
                </p>
              )}

              {/* Status pill */}
              {unlocked ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400 text-forest-900 text-sm font-bold mb-4">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
                  Badj sa debloke!
                  {state?.unlocked_at && (
                    <span className="font-mono text-xs opacity-80 ml-1">
                      · {formatHaitianDate(state.unlocked_at)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-100 border border-cream-300 text-earth-700 text-sm font-semibold mb-4">
                  <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Poko debloke
                </div>
              )}

              {/* Long description */}
              {badge.description && (
                <p className="text-sm md:text-base text-earth-700 leading-relaxed">
                  {badge.description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Progress + Tip side-by-side ──────────────────────────────── */}
        <section className="grid md:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
          {/* Progress card */}
          <div className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
              Pwogresyon ou
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-4xl font-bold text-ink">
                {currentValue}
              </span>
              <span className="text-earth-500 font-medium">
                / {badge.criteria_threshold} {unit}
              </span>
            </div>
            <div className="text-xs text-earth-600 mb-3">
              {METRIC_LABEL[metric]}
            </div>

            <div className="h-2.5 rounded-full bg-cream-100 overflow-hidden mb-3">
              <div
                className={`h-full transition-[width] duration-700 ${
                  unlocked
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                    : 'bg-gradient-to-r from-forest-400 to-gold-400'
                }`}
                style={{
                  width: `${Math.max(2, Math.min(100, Math.round(progress * 100)))}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-earth-600">
              <span>{Math.round(progress * 100)}% reyalize</span>
              {!unlocked && remaining > 0 && (
                <span className="font-medium">
                  Manke {remaining} {unit}
                </span>
              )}
              {unlocked && (
                <span className="text-gold-700 font-bold">100% · Konplete</span>
              )}
            </div>
          </div>

          {/* Tip card */}
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-5 md:p-6">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-forest-800 font-bold mb-3">
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              {unlocked ? 'Kontinye konsa' : 'Kijan pou debloke'}
            </div>
            <p className="text-sm text-forest-900/90 leading-relaxed mb-4">
              {tip.text}
            </p>
            <Link
              href={tip.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition"
            >
              {tip.linkLabel}
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </div>
        </section>

        {/* ── Recent activity (metric-specific) ────────────────────────── */}
        {recentActivity.items.length > 0 && (
          <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-1">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Dènye aktivite
                </div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {recentActivity.title}
                </h3>
              </div>
            </div>
            <ul className="divide-y divide-cream-100">
              {recentActivity.items.map((item, i) => (
                <li
                  key={i}
                  className="py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-ink">{item.label}</span>
                  <span className="text-earth-600 font-mono text-xs">
                    {item.meta}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── How it's measured (criteria meta) ────────────────────────── */}
        <section className="mt-6 md:mt-8 rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-5">
          <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-2">
            Detay teknik
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-earth-700">
            <div>
              <span className="text-earth-500">Mezi: </span>
              <span className="font-mono text-ink">
                {METRIC_LABEL[metric]}
              </span>
            </div>
            <div>
              <span className="text-earth-500">Sèyi: </span>
              <span className="font-mono text-ink">
                {badge.criteria_threshold} {unit}
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Per-metric recent activity feeder. Returns up to 5 rows, with a Kreyòl
// header. We return at most 5 because the detail page is a focused view —
// the user has the dedicated page for each underlying data type.
// ───────────────────────────────────────────────────────────────────────────
type ActivityItem = { label: string; meta: string };

async function fetchRecentActivity(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  metric: ReturnType<typeof asBadgeMetric>
): Promise<{ title: string; items: ActivityItem[] }> {
  if (metric === 'glycemia_in_range') {
    const { data } = await supabase
      .from('health_logs')
      .select('blood_sugar, logged_at')
      .eq('user_id', userId)
      .gte('blood_sugar', 70)
      .lte('blood_sugar', 130)
      .order('logged_at', { ascending: false })
      .limit(5);
    const rows = (data ?? []) as Array<{
      blood_sugar: number | null;
      logged_at: string;
    }>;
    return {
      title: 'Dènye mezi nan zòn (70–130 mg/dL)',
      items: rows.map((r) => ({
        label: `${r.blood_sugar} mg/dL`,
        meta: formatHaitianDateTime(r.logged_at),
      })),
    };
  }

  if (
    metric === 'streak_days' ||
    metric === 'hydration_days' ||
    metric === 'movement_days' ||
    metric === 'tisane_count' ||
    metric === 'tasks_done'
  ) {
    let chip: string | null = null;
    let title = 'Dènye tach konplete';
    if (metric === 'hydration_days') {
      chip = 'idratasyon';
      title = 'Dènye jou idratasyon';
    } else if (metric === 'movement_days') {
      chip = 'mouvman';
      title = 'Dènye jou mouvman';
    } else if (metric === 'tisane_count') {
      chip = 'tizan';
      title = 'Dènye tas tizan';
    } else if (metric === 'streak_days') {
      title = 'Dènye jou aktif (streak)';
    }

    const { data } = await supabase
      .from('user_task_completions')
      .select(
        'completion_date, task_id, program_tasks!inner(title, chip_label)'
      )
      .eq('user_id', userId)
      .order('completion_date', { ascending: false })
      .limit(20);

    // Supabase TS types model the relation as an array even for a many-to-one
    // FK; normalize to a single object so the rest of the function stays clean.
    type RawRow = {
      completion_date: string;
      task_id: string;
      program_tasks:
        | { title: string; chip_label: string | null }
        | { title: string; chip_label: string | null }[]
        | null;
    };
    const rows = (data ?? []) as unknown as RawRow[];

    const flatten = (r: RawRow) => {
      const pt = r.program_tasks;
      const obj = Array.isArray(pt) ? pt[0] ?? null : pt;
      return { ...r, program_tasks: obj };
    };

    const filtered = (chip
      ? rows
          .map(flatten)
          .filter(
            (r) =>
              (r.program_tasks?.chip_label ?? '').toLowerCase() ===
              chip!.toLowerCase()
          )
      : rows.map(flatten));

    const dedupedByDate = new Map<string, ActivityItem>();
    for (const r of filtered) {
      const date = r.completion_date;
      if (dedupedByDate.has(date)) continue;
      dedupedByDate.set(date, {
        label: r.program_tasks?.title ?? 'Tach konplete',
        meta: formatHaitianDate(date),
      });
      if (dedupedByDate.size >= 5) break;
    }

    return { title, items: Array.from(dedupedByDate.values()) };
  }

  if (metric === 'program_day') {
    const { data } = await supabase
      .from('user_programs')
      .select(
        'started_at, programs(name, total_days)'
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = data as {
      started_at: string;
      programs: { name: string; total_days: number } | null;
    } | null;
    if (!row) {
      return { title: 'Pwogram aktif', items: [] };
    }

    const days = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(row.started_at).getTime()) / 86_400_000
      ) + 1
    );
    return {
      title: 'Pwogram aktif',
      items: [
        {
          label: row.programs?.name ?? 'Pwogram',
          meta: `Kòmanse ${formatHaitianDate(row.started_at)}`,
        },
        {
          label: 'Jou pase',
          meta: `${days} jou`,
        },
        {
          label: 'Total pwogram',
          meta: `${row.programs?.total_days ?? '—'} jou`,
        },
      ],
    };
  }

  if (metric === 'level') {
    const { data: unlockedBadges } = await supabase
      .from('user_badges')
      .select('unlocked_at, badges(name, sub)')
      .eq('user_id', userId)
      .eq('unlocked', true)
      .order('unlocked_at', { ascending: false })
      .limit(5);

    type RawBadgeRow = {
      unlocked_at: string | null;
      badges:
        | { name: string; sub: string | null }
        | { name: string; sub: string | null }[]
        | null;
    };
    const rows = (unlockedBadges ?? []) as unknown as RawBadgeRow[];

    return {
      title: 'Dènye badj ou debloke',
      items: rows.map((r) => {
        const b = Array.isArray(r.badges) ? r.badges[0] ?? null : r.badges;
        return {
          label: b?.name ?? 'Badj',
          meta: r.unlocked_at ? formatHaitianDate(r.unlocked_at) : '—',
        };
      }),
    };
  }

  return { title: 'Aktivite', items: [] };
}
