import { PartyPopper } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import Hero from '@/components/dashboard/hero';
import StatsRow from '@/components/dashboard/stats-row';
import ChecklistPanel, {
  type ChecklistItem,
} from '@/components/dashboard/checklist-panel';
import BadgesPanel, {
  type DashboardBadge,
} from '@/components/dashboard/badges-panel';
import DownloadsPanel from '@/components/dashboard/downloads-panel';
import UpsellCard from '@/components/dashboard/upsell-card';
import type { BadgeIcon, TaskChipKind } from '@/types/database';

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

  // Fan-out fetch
  const today = new Date().toISOString().slice(0, 10);

  const [
    profileResult,
    activeProgramResult,
    badgesResult,
    userBadgesResult,
    resourcesResult,
    healthLogsResult,
    adviceResult,
    productResult,
    streakResult,
    levelResult,
    levelNameResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    // Active program with its tasks
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
      .from('daily_advice')
      .select('*')
      .lte('publish_date', today)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
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
  } | null;

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

  // Fetch program tasks + today's completions in parallel (depends on programId)
  const [tasksResult, completionsResult] = await Promise.all([
    programId
      ? supabase
          .from('program_tasks')
          .select('*')
          .eq('program_id', programId)
          .order('order_index', { ascending: true })
      : Promise.resolve({ data: [] as Array<{
          id: string;
          title: string;
          meta: string | null;
          chip_label: string | null;
          chip_kind: string;
          order_index: number;
        }>, error: null }),
    supabase
      .from('user_task_completions')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('completion_date', today),
  ]);

  const programTasks = (tasksResult.data ?? []) as Array<{
    id: string;
    title: string;
    meta: string | null;
    chip_label: string | null;
    chip_kind: string;
  }>;
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

  // ---- Build badges with real progress ----
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

  // ---- Health logs → sparklines ----
  const healthLogs = (healthLogsResult.data ?? []) as Array<{
    blood_sugar: number | null;
    weight: number | null;
    logged_at: string;
  }>;
  const reversed = [...healthLogs].reverse();
  const bsValuesReal = reversed
    .map((l) => l.blood_sugar)
    .filter((v): v is number => v !== null);
  const wtValuesReal = reversed
    .map((l) => l.weight)
    .filter((v): v is number => v !== null);

  // Fallback so the wireframe still tells a story before the user logs anything
  const bsValues =
    bsValuesReal.length >= 2 ? bsValuesReal : [142, 138, 134, 129, 131, 124, 118];
  const wtValues =
    wtValuesReal.length >= 2
      ? wtValuesReal
      : [74.0, 73.8, 73.6, 73.4, 73.0, 72.6, 72.4];

  const latestBloodSugar = bsValues[bsValues.length - 1];
  const previousBloodSugar = bsValues[bsValues.length - 2];
  const bsDelta =
    previousBloodSugar != null && previousBloodSugar !== 0
      ? ((latestBloodSugar - previousBloodSugar) / previousBloodSugar) * 100
      : null;

  const latestWeight = wtValues[wtValues.length - 1];
  const firstWeight = wtValues[0];
  const wtDelta =
    latestWeight != null && firstWeight != null ? latestWeight - firstWeight : null;

  // ---- Daily totals ----
  const doneToday = tasks.filter((t) => t.done).length;
  const totalToday = tasks.length;
  const todayCompletion = totalToday > 0 ? doneToday / totalToday : 0;

  // ---- Plan day from active program start_date ----
  let dayOfPlan = 1;
  let totalDays = activeProgram?.programs?.total_days ?? 30;
  if (activeProgram?.started_at) {
    const start = new Date(activeProgram.started_at).getTime();
    const elapsedDays =
      Math.floor((Date.now() - start) / 86400000) + 1;
    dayOfPlan = Math.max(1, Math.min(totalDays, elapsedDays));
  }

  // ---- Daily advice ----
  const advice = adviceResult.data as
    | { body_html: string; plant_name: string | null; publish_date: string; duration_seconds: number | null }
    | null;
  const adviceBody =
    advice?.body_html ??
    'Jodi a, evite <em>sik rafine a</em>. Bwè plis dlo, e prepare yon tas tizan <em>mounn-bwa</em> apre manje midi pou ekilibre glikemi an.';
  const advicePlant =
    advice?.plant_name ?? 'Mounn-bwa — Cnidoscolus chayamansa';

  // ---- Featured product ----
  const product = productResult.data as
    | {
        name: string;
        tagline: string | null;
        botanical: string | null;
        price: number;
        old_price: number | null;
        currency: string;
        shipping_note: string | null;
      }
    | null;
  const currencySymbol = (c: string) =>
    c === 'USD' ? '$' : c === 'HTG' ? 'G' : '€';
  const upsellPrice = product
    ? `${currencySymbol(product.currency)} ${product.price.toFixed(2)}`
    : '€ 24.90';
  const upsellOldPrice =
    product && product.old_price
      ? `${currencySymbol(product.currency)} ${product.old_price.toFixed(2)}`
      : undefined;

  // ---- Identity helpers ----
  const userName =
    profile?.full_name || profile?.email?.split('@')[0] || 'Manm';
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

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${planLabel} · Niv. ${level} ${levelName}`}
        unreadCount={unreadCount}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] grid gap-5 md:gap-6">
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

        <StatsRow
          bloodSugar={{
            value: latestBloodSugar ?? null,
            target: '70 – 130',
            deltaPct: bsDelta,
            spark: bsValues,
          }}
          weight={{
            value: latestWeight ?? null,
            target: '68 – 71 kg',
            deltaKg: wtDelta,
            spark: wtValues,
          }}
          dailyGoal={{
            percent: todayCompletion * 100,
            doneToday,
            totalToday: Math.max(totalToday, 1),
            deltaVsYesterday: undefined,
          }}
        />

        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          <ChecklistPanel initialTasks={tasks} />
          <BadgesPanel badges={badges} level={level} levelName={levelName} />
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 md:gap-6">
          <DownloadsPanel resources={resourcesResult.data ?? []} />
          <UpsellCard
            productName={product?.name ?? 'Hois Detox Plus'}
            tagline={
              product?.tagline ??
              'Yon booste pou plan ou — mounn-bwa konsantre + ekstra jenjanm pou ekilibre sik la pi vit.'
            }
            botanical={
              product?.botanical ?? 'Cnidoscolus chayamansa × Zingiber officinale'
            }
            price={upsellPrice}
            oldPrice={upsellOldPrice}
            shippingNote={product?.shipping_note ?? 'Livrezon gratis · Pòtoprens'}
          />
        </div>
      </div>
    </>
  );
}
