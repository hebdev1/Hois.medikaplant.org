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

// ---- Static program/plan content (would live in a `programs` table eventually) ----
const TODAY_TASKS: ChecklistItem[] = [
  {
    id: 't1',
    title: 'Bwè 2 lit dlo',
    meta: 'Avan 6è swa',
    chip: 'Idratasyon',
    chipKind: 'forest',
    done: true,
  },
  {
    id: 't2',
    title: 'Pran tizan Hois Detox la (maten)',
    meta: 'Mounn-bwa + jenjanm',
    chip: 'Tizan',
    chipKind: 'gold',
    done: true,
  },
  {
    id: 't3',
    title: 'Mache 30 minit deyò',
    meta: 'Pi bon ant 7è ak 9è di maten',
    chip: 'Mouvman',
    chipKind: 'forest',
    done: true,
  },
  {
    id: 't4',
    title: 'Note glikemi avan dine',
    meta: 'Mete chif la nan Swivi Sante',
    chip: 'Mezi',
    chipKind: 'cream',
    done: false,
  },
  {
    id: 't5',
    title: 'Manje 3 légim diferan jodi a',
    meta: 'Yon chwa: kalalou, militon, epina',
    chip: 'Nitrisyon',
    chipKind: 'forest',
    done: false,
  },
  {
    id: 't6',
    title: 'Medite 5 minit avan dòmi',
    meta: 'Souflé pwofon — kalme nerf yo',
    chip: 'Lespri',
    chipKind: 'gold',
    done: false,
  },
];

const BADGES: DashboardBadge[] = [
  { id: 'b1', name: 'Premye Semèn', sub: '7 jou san sote', unlocked: true, icon: 'sprout' },
  { id: 'b2', name: 'Tizan Eksprè', sub: '30 tas pran', unlocked: true, icon: 'leaf' },
  { id: 'b3', name: 'Idratasyon', sub: '2L pa jou × 10', unlocked: true, icon: 'droplet' },
  {
    id: 'b4',
    name: '12 Jou Seri',
    sub: 'Aktif!',
    unlocked: true,
    justUnlocked: true,
    icon: 'flame',
  },
  {
    id: 'b5',
    name: 'Kò an Mouvman',
    sub: '3 jou ankò',
    unlocked: false,
    progress: 0.78,
    icon: 'activity',
  },
  {
    id: 'b6',
    name: 'Mèt Glikemi',
    sub: '14 jou nan zòn',
    unlocked: false,
    progress: 0.85,
    icon: 'target',
  },
  {
    id: 'b7',
    name: 'Yon Mwa Anfòm',
    sub: '30 jou plan an',
    unlocked: false,
    progress: 0.6,
    icon: 'calendar',
  },
  {
    id: 'b8',
    name: 'Èrboris Pwofesyonèl',
    sub: 'Niveau 5',
    unlocked: false,
    progress: 0.35,
    icon: 'star',
  },
];

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

  const [
    { data: profileRaw },
    { data: resourcesRaw },
    { data: healthLogsRaw },
    { data: activeSubRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
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
      .from('subscriptions')
      .select('plan, start_date, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRaw as {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;
  const resources = (resourcesRaw ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    type: 'pdf' | 'video' | 'audio';
    file_url: string;
    created_at: string;
    duration_seconds: number | null;
    file_size_bytes: number | null;
    category: string | null;
  }>;
  const healthLogs = (healthLogsRaw ?? []) as Array<{
    blood_sugar: number | null;
    weight: number | null;
    logged_at: string;
  }>;
  const activeSub = activeSubRaw as
    | { plan: string; start_date: string; end_date: string | null }
    | null;

  // ---- Derive plan day & total ----
  let dayOfPlan = 18;
  let totalDays = 30;
  if (activeSub?.start_date) {
    const start = new Date(activeSub.start_date).getTime();
    const now = Date.now();
    const elapsedDays = Math.max(
      1,
      Math.floor((now - start) / 86400000) + 1
    );
    dayOfPlan = elapsedDays;
    if (activeSub.end_date) {
      const span = Math.round(
        (new Date(activeSub.end_date).getTime() - start) / 86400000
      );
      totalDays = Math.min(span, 365);
    }
  }

  // ---- Derive sparklines from health_logs (oldest → newest) ----
  const reversed = [...healthLogs].reverse();
  const bloodSugarSpark = reversed
    .map((l) => l.blood_sugar)
    .filter((v): v is number => v !== null);
  const weightSpark = reversed
    .map((l) => l.weight)
    .filter((v): v is number => v !== null);

  // Use stub fallbacks so the wireframe renders before users log data
  const bsValues =
    bloodSugarSpark.length >= 2
      ? bloodSugarSpark
      : [142, 138, 134, 129, 131, 124, 118];
  const wtValues =
    weightSpark.length >= 2 ? weightSpark : [74.0, 73.8, 73.6, 73.4, 73.0, 72.6, 72.4];

  const latestBloodSugar = bsValues[bsValues.length - 1];
  const previousBloodSugar = bsValues[bsValues.length - 2];
  const bsDelta =
    previousBloodSugar != null && previousBloodSugar !== 0
      ? ((latestBloodSugar - previousBloodSugar) / previousBloodSugar) * 100
      : null;

  const latestWeight = wtValues[wtValues.length - 1];
  const firstWeight = wtValues[0];
  const wtDelta = latestWeight != null && firstWeight != null ? latestWeight - firstWeight : null;

  // ---- Derive today's progress from checklist ----
  const doneToday = TODAY_TASKS.filter((t) => t.done).length;
  const totalToday = TODAY_TASKS.length;
  const todayCompletion = totalToday > 0 ? doneToday / totalToday : 0;

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] : 'Hoïs Bazilik';

  const justSubscribedPlan =
    searchParams.welcome && PLAN_LABELS[searchParams.welcome]
      ? PLAN_LABELS[searchParams.welcome]
      : null;

  return (
    <>
      <Topbar userName={shortName} userCondition={`${planLabel} · Dyabèt Tip 2`} unreadCount={2} />
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
          planName={planLabel}
          planVariant="Detox & Sik"
          dayOfPlan={dayOfPlan}
          totalDays={totalDays}
          streak={12}
          doneToday={doneToday}
          totalToday={totalToday}
          todayCompletion={todayCompletion}
          todayLabel={formatHaitianDate(new Date())}
          dailyAdvice={{
            date: formatHaitianDate(new Date()),
            bodyHtml:
              'Jodi a, evite <em>sik rafine a</em>. Bwè plis dlo, e prepare yon tas tizan <em>mounn-bwa</em> apre manje midi pou ekilibre glikemi an.',
            plant: 'Mounn-bwa — Cnidoscolus chayamansa',
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
            totalToday,
            deltaVsYesterday: 1,
          }}
        />

        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          <ChecklistPanel initialTasks={TODAY_TASKS} />
          <BadgesPanel badges={BADGES} level={3} levelName="Apranti Èrboris" />
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 md:gap-6">
          <DownloadsPanel resources={resources} />
          <UpsellCard
            productName="Hois Detox Plus"
            tagline="Yon booste pou plan ou — mounn-bwa konsantre + ekstra jenjanm pou ekilibre sik la pi vit."
            botanical="Cnidoscolus chayamansa × Zingiber officinale"
            price="€ 24.90"
            oldPrice="€ 32.00"
          />
        </div>
      </div>
    </>
  );
}
