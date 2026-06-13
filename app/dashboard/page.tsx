import { PartyPopper } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import Hero from '@/components/dashboard/hero';
import ChecklistPanel, {
  type ChecklistItem,
} from '@/components/dashboard/checklist-panel';
import BadgesPanel, {
  type DashboardBadge,
} from '@/components/dashboard/badges-panel';
import DownloadsPanel from '@/components/dashboard/downloads-panel';
import ShopSlider from '@/components/dashboard/shop-slider';
import TreatmentsSection, {
  type Treatment,
} from '@/components/dashboard/treatments-section';
// Consultations: bookings now happen on medikaplantshop.com/consultation.
// The CTA panel still ships on /dashboard/health; this page no longer
// renders it (the health page is the canonical home for care content).
import OnboardingBlock from '@/components/dashboard/blocks/onboarding-block';
import HoisReflectionBlock from '@/components/dashboard/blocks/hois-reflection-block';
import AdaptiveMetrics from '@/components/dashboard/blocks/adaptive-metrics';
import {
  buildDashboardContext,
  orderedBlocks,
  type BlockId,
} from '@/lib/dashboard/personalization';
import type { BadgeIcon, TaskChipKind, Database } from '@/types/database';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const DAYS_OF_WEEK_HT = [
  'Dimanch',
  'Lendi',
  'Madi',
  'Mèkredi',
  'Jedi',
  'Vandredi',
  'Samdi',
];
const MONTHS_HT = [
  'Janvye',
  'Fevriye',
  'Mas',
  'Avril',
  'Me',
  'Jen',
  'Jiyè',
  'Out',
  'Septanm',
  'Oktòb',
  'Novanm',
  'Desanm',
];

function formatHaitianDate(d: Date) {
  return `${DAYS_OF_WEEK_HT[d.getDay()]} ${d.getDate()} ${MONTHS_HT[d.getMonth()]}`;
}

export const dynamic = 'force-dynamic';

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: { welcome?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [
    profileResult,
    medicalResult,
    activeProgramResult,
    badgesResult,
    userBadgesResult,
    resourcesResult,
    healthLogsResult,
    treatmentsResult,
    adviceResult,
    productResult,
    streakResult,
    levelResult,
    levelNameResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('user_medical_info')
      .select('conditions, health_goal')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_programs')
      .select(
        'id, started_at, finished_at, is_active, programs(id, name, variant, total_days, slug)'
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('badges')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase.from('user_badges').select('*').eq('user_id', user.id),
    supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(7),
    supabase
      .from('treatment_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    // Pull the 10 most-recent published advice rows. We filter
    // client-side to prefer the most recent one whose condition_tags
    // overlap with this member's conditions, falling back to the most
    // recent general advice (empty tags) when none match. Doing this
    // here keeps the query cheap (≤10 small rows) and lets us avoid a
    // second sequential roundtrip.
    supabase
      .from('daily_advice')
      .select('*')
      .lte('publish_date', today)
      .order('publish_date', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc('user_streak', { uid: user.id }),
    supabase.rpc('user_level', { uid: user.id }),
    supabase.rpc('user_level_name', { uid: user.id }),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = profileResult.data as {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    created_at: string;
  } | null;

  const medical = medicalResult.data as {
    conditions: string[] | null;
    health_goal: string | null;
  } | null;
  const conditions = (medical?.conditions ?? []).filter(Boolean);
  // Hoisted once and reused by both the daily-task filter and the
  // condition-aware advice picker below — avoids constructing the same
  // Set twice per render.
  const conditionSet = new Set(conditions);
  const healthGoal = medical?.health_goal ?? null;

  type ActiveProgramRow = {
    id: string;
    started_at: string;
    finished_at: string | null;
    is_active: boolean;
    programs: {
      id: string;
      name: string;
      variant: string | null;
      total_days: number;
      slug: string;
    } | null;
  };
  const activeProgram = activeProgramResult.data as ActiveProgramRow | null;
  const programId = activeProgram?.programs?.id;

  // Compute which day of the program the member is on. The dashboard
  // shows tasks scheduled for exactly that day so a new enrollee sees
  // day-1 the moment they sign up and progresses one day at a time. We
  // clamp at total_days so members who finished the program don't get
  // an out-of-range query.
  const programTotalDays = activeProgram?.programs?.total_days ?? 30;
  let currentDay = 1;
  if (activeProgram?.started_at) {
    const startMs = new Date(activeProgram.started_at).getTime();
    const elapsedDays = Math.floor((Date.now() - startMs) / 86_400_000);
    currentDay = Math.max(1, Math.min(programTotalDays, elapsedDays + 1));
  }

  const [tasksResult, completionsResult] = await Promise.all([
    programId
      ? supabase
          .from('program_tasks')
          .select('*')
          .eq('program_id', programId)
          .eq('day_number', currentDay)
          .order('order_index', { ascending: true })
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            title: string;
            meta: string | null;
            chip_label: string | null;
            chip_kind: string;
            order_index: number;
            condition_tags: string[] | null;
            day_number: number;
          }>,
          error: null,
        }),
    supabase
      .from('user_task_completions')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('completion_date', today),
  ]);

  type RawTask = {
    id: string;
    title: string;
    meta: string | null;
    chip_label: string | null;
    chip_kind: string;
    condition_tags: string[] | null;
  };
  const allProgramTasks = (tasksResult.data ?? []) as RawTask[];

  // Condition-aware filter on top of the day-level query. Rule:
  //   • Tasks with empty condition_tags are general — shown to everyone.
  //   • Tasks with tags appear only when at least one tag is in the
  //     member's conditions array.
  //   • Brand-new members who haven't filled their profile yet get the
  //     full list back so the dashboard isn't blank on day 1 — they see
  //     everything until they declare a condition that narrows it.
  const hasConditions = conditionSet.size > 0;
  const programTasks = allProgramTasks.filter((t) => {
    const tags = t.condition_tags ?? [];
    if (tags.length === 0) return true;
    if (!hasConditions) return true;
    return tags.some((tag) => conditionSet.has(tag));
  });

  const completedTaskIds = new Set(
    ((completionsResult.data ?? []) as Array<{ task_id: string }>).map(
      (c) => c.task_id
    )
  );

  const tasks: ChecklistItem[] = programTasks.map((t) => ({
    id: t.id,
    title: t.title,
    meta: t.meta ?? '',
    chip: t.chip_label ?? '',
    chipKind: (['forest', 'gold', 'cream'].includes(t.chip_kind)
      ? t.chip_kind
      : 'forest') as TaskChipKind,
    done: completedTaskIds.has(t.id),
  }));

  // ---- Badges with real progress ----
  type CatalogBadge = {
    id: string;
    slug: string;
    name: string;
    sub: string | null;
    icon: string;
    display_order: number;
  };
  type UserBadgeRow = {
    badge_id: string;
    unlocked: boolean;
    just_unlocked: boolean;
    progress: number;
  };
  const catalog = (badgesResult.data ?? []) as CatalogBadge[];
  const userBadgesMap = new Map(
    ((userBadgesResult.data ?? []) as UserBadgeRow[]).map((ub) => [
      ub.badge_id,
      ub,
    ])
  );
  const badges: DashboardBadge[] = catalog.map((b) => {
    const state = userBadgesMap.get(b.id);
    const icon = (['sprout', 'leaf', 'droplet', 'flame', 'activity', 'target', 'calendar', 'star'].includes(b.icon)
      ? b.icon
      : 'star') as BadgeIcon;
    return {
      id: b.id,
      name: b.name,
      sub: b.sub ?? '',
      unlocked: state?.unlocked ?? false,
      justUnlocked: state?.just_unlocked ?? false,
      progress: state?.unlocked ? undefined : Number(state?.progress ?? 0),
      icon,
    };
  });

  // ---- Real health logs (NO fake fallback — honest empty states) ----
  const healthLogs = (healthLogsResult.data ?? []) as Array<{
    blood_sugar: number | null;
    weight: number | null;
    blood_pressure_systolic: number | null;
    logged_at: string;
  }>;
  const realLogCount = healthLogs.length;

  const treatments = (treatmentsResult.data ?? []) as Treatment[];

  // ---- Daily totals ----
  const doneToday = tasks.filter((t) => t.done).length;
  const totalToday = tasks.length;
  const todayCompletion = totalToday > 0 ? doneToday / totalToday : 0;

  // ---- Plan day ----
  let dayOfPlan = 1;
  const totalDays = activeProgram?.programs?.total_days ?? 30;
  if (activeProgram?.started_at) {
    const start = new Date(activeProgram.started_at).getTime();
    const elapsedDays = Math.floor((Date.now() - start) / 86400000) + 1;
    dayOfPlan = Math.max(1, Math.min(totalDays, elapsedDays));
  }

  // ---- Daily advice (condition-aware) ─────────────────────────────────
  // Pick the most recent advice whose condition_tags overlap with this
  // member's conditions. If nothing matches, fall back to the most
  // recent general advice (empty condition_tags array). The list is
  // already ordered desc by publish_date so a linear scan returns the
  // newest match first.
  type AdviceRow = {
    body_html: string;
    plant_name: string | null;
    publish_date: string;
    duration_seconds: number | null;
    condition_tags: string[] | null;
  };
  const adviceCandidates = (adviceResult.data ?? []) as AdviceRow[];
  const matchedAdvice = adviceCandidates.find((a) =>
    (a.condition_tags ?? []).some((t) => conditionSet.has(t))
  );
  const generalAdvice = adviceCandidates.find(
    (a) => !a.condition_tags || a.condition_tags.length === 0
  );
  const advice = matchedAdvice ?? generalAdvice ?? adviceCandidates[0] ?? null;
  const adviceBody =
    advice?.body_html ??
    'Jodi a, evite <em>sik rafine a</em>. Bwè plis dlo, e prepare yon tas tizan <em>mounn-bwa</em> apre manje midi pou ekilibre glikemi an.';
  const advicePlant = advice?.plant_name ?? 'Mounn-bwa — Cnidoscolus chayamansa';

  // ---- Identity ----
  // Note: the legacy `products` table fetch above (productResult) is kept
  // for now in case we revive a DB-driven featured product. The new
  // ShopSlider component embeds a curated list of medikaplantshop.com
  // products directly — no DB roundtrip needed for the shop carousel.
  void productResult;

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] : 'Hoïs Bazilik';

  const streak = (streakResult.data as number | null) ?? 0;
  const level = (levelResult.data as number | null) ?? 1;
  const levelName = (levelNameResult.data as string | null) ?? 'Nouvo Manm';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  const justSubscribedPlan =
    searchParams.welcome && PLAN_LABELS[searchParams.welcome]
      ? PLAN_LABELS[searchParams.welcome]
      : null;

  // ── Build the personalization context ─────────────────────────────────
  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 0;

  const ctx = buildDashboardContext({
    plan: profile?.plan ?? 'basic',
    conditions,
    healthGoal,
    accountAgeDays,
    realLogCount,
    streak,
    hasProgram: tasks.length > 0,
    hasTreatments: treatments.length > 0,
  });

  // ── Map each block id → rendered node ─────────────────────────────────
  const blockNodes: Record<BlockId, React.ReactNode> = {
    onboarding: (
      <OnboardingBlock
        firstName={shortName}
        hasGoal={healthGoal !== null}
        hasCondition={conditions.length > 0}
        hasLoggedMetric={realLogCount > 0}
      />
    ),
    hero: (
      <Hero
        userShortName={shortName}
        planName={activeProgram?.programs?.name ?? planLabel}
        planVariant={activeProgram?.programs?.variant ?? 'Detox & Sik'}
        dayOfPlan={dayOfPlan}
        totalDays={totalDays}
        streak={streak}
        doneToday={doneToday}
        totalToday={totalToday}
        todayCompletion={todayCompletion}
        todayLabel={formatHaitianDate(new Date())}
        dailyAdvice={{
          date: formatHaitianDate(
            advice?.publish_date ? new Date(advice.publish_date) : new Date()
          ),
          bodyHtml: adviceBody,
          plant: advicePlant,
        }}
      />
    ),
    hois: <HoisReflectionBlock />,
    metrics: ctx.primaryMetric ? (
      <AdaptiveMetrics
        primaryMetric={ctx.primaryMetric}
        logs={healthLogs}
        dailyGoal={{
          percent: todayCompletion * 100,
          doneToday,
          totalToday: Math.max(totalToday, 1),
        }}
      />
    ) : null,
    checklist: <ChecklistPanel initialTasks={tasks} />,
    treatments: <TreatmentsSection treatments={treatments} />,
    badges: <BadgesPanel badges={badges} level={level} levelName={levelName} />,
    downloads: <DownloadsPanel resources={resourcesResult.data ?? []} />,
    upsell: <ShopSlider />,
  };

  const blocks = orderedBlocks(ctx);

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${planLabel} · Niv. ${level} ${levelName}`}
        unreadCount={unreadCount}
      />
      {/* Single-column grid with minmax(0,1fr) — without the 0 lower
          bound, a grid item's intrinsic min-size defaults to auto, which
          lets a child like the shop slider's horizontal flex strip
          balloon the column wider than the viewport. */}
      <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] grid grid-cols-[minmax(0,1fr)] gap-5 md:gap-6 overflow-x-hidden">
        {justSubscribedPlan && (
          <div className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 flex items-start gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 shrink-0">
              <PartyPopper className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-bold text-forest-900">
                Felisitasyon! Ou vin yon manm {justSubscribedPlan}.
              </h2>
              <p className="text-sm text-forest-800 mt-0.5">
                Plan ou aktif kounye a. Tout resous yo disponib pou ou.
              </p>
            </div>
          </div>
        )}

        {blocks.map((id) =>
          blockNodes[id] ? (
            <div key={id} className="min-w-0">
              {blockNodes[id]}
            </div>
          ) : null
        )}
      </div>
    </>
  );
}
