import Link from 'next/link';
import { Activity, Calendar, Target, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import MetricTabs, {
  type MetricKey,
} from '@/components/dashboard/metric-tabs';
import RangeChips from '@/components/dashboard/range-chips';
// Helpers come from a plain module, NOT the 'use client' RangeChips file —
// importing a non-component value out of a 'use client' module makes Next.js
// hand the server component a client reference, which fails as
// "TypeError: c is not a function" at request time.
import { rangeFromSearch } from '@/components/dashboard/range-utils';
import HealthLineChart from '@/components/dashboard/health-line-chart';
import LogForm from '@/components/dashboard/log-form';
import LogEntries, { type LogEntry } from '@/components/dashboard/log-entries';
import HealthSummary from '@/components/dashboard/health-summary';
import ExportCsvButton from '@/components/dashboard/export-csv-button';
import ConditionsStrip, {
  primaryMetricFor,
} from '@/components/dashboard/conditions-strip';
import TreatmentsSection, {
  type Treatment,
} from '@/components/dashboard/treatments-section';
import ConsultationsPanel from '@/components/dashboard/consultations-panel';
import type { Database } from '@/types/database';


export const metadata = { title: 'Swivi Sante' };
export const dynamic = 'force-dynamic';

// Health-goal labels — mirror the options in /dashboard/settings so the
// banner on this page reads the same goal the member picked there.
const HEALTH_GOAL_LABELS: Record<string, string> = {
  manage_diabetes: 'Jere dyabèt',
  manage_hypertension: 'Jere tansyon',
  lose_weight: 'Pèdi pwa',
  gain_weight: 'Pran pwa',
  spiritual_balance: 'Ekilib espirityèl',
  detox: 'Detox / netwayaj',
  general_wellness: 'Byennèt jeneral',
  fertility: 'Fètilite',
  other: 'Objektif pèsonèl',
};

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const METRIC_LABELS: Record<MetricKey, { label: string; unit: string }> = {
  blood_sugar: { label: 'Sik nan san', unit: 'mg/dL' },
  weight: { label: 'Pwa kò', unit: 'kg' },
  pressure: { label: 'Tansyon sistolik', unit: 'mmHg' },
};

const METRIC_DEFAULT_TARGET: Record<MetricKey, { min: number; max: number }> = {
  blood_sugar: { min: 70, max: 130 },
  weight: { min: 60, max: 75 },
  pressure: { min: 100, max: 130 },
};

function metricFromSearch(
  v: string | undefined,
  fallback: MetricKey
): MetricKey {
  if (v === 'blood_sugar' || v === 'weight' || v === 'pressure') return v;
  return fallback;
}

type HealthLog = {
  id: string;
  blood_sugar: number | null;
  weight: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  notes: string | null;
  logged_at: string;
};

function valueOf(metric: MetricKey, row: HealthLog): number | null {
  if (metric === 'blood_sugar') return row.blood_sugar;
  if (metric === 'weight') return row.weight;
  return row.blood_pressure_systolic;
}

export default async function HealthPage({
  searchParams,
}: {
  searchParams: { metric?: string; range?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const range = rangeFromSearch(searchParams.range);

  // Fetch profile (for topbar), preferences (for target zone), a wide window
  // of logs (90 days max), medical conditions, and any treatments from admins.
  const since = new Date(Date.now() - 90 * 86400000).toISOString();

  const [
    profileResult,
    prefsResult,
    logsResult,
    medicalResult,
    treatmentsResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_preferences')
      .select(
        'target_blood_sugar_min, target_blood_sugar_max, target_weight_kg'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: true }),
    supabase
      .from('user_medical_info')
      .select('conditions, health_goal, health_goal_other')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('treatment_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const medicalRow = medicalResult.data as {
    conditions: string[] | null;
    health_goal: string | null;
    health_goal_other: string | null;
  } | null;
  const conditions = (medicalRow?.conditions ?? []).filter(Boolean);
  const healthGoal = medicalRow?.health_goal ?? null;
  const healthGoalOther = medicalRow?.health_goal_other ?? null;
  const treatments = (treatmentsResult.data ?? []) as Treatment[];

  // Default the active metric to whichever metric maps to the user's first
  // matching condition — so a diabetic user lands on "Sik nan san" by
  // default, a hypertensive user on "Tansyon", etc. URL ?metric= always wins.
  const conditionDefault = primaryMetricFor(conditions) ?? 'blood_sugar';
  const metric = metricFromSearch(searchParams.metric, conditionDefault);

  const profile = profileResult.data as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;

  const prefs = prefsResult.data as {
    target_blood_sugar_min: number;
    target_blood_sugar_max: number;
    target_weight_kg: number | null;
  } | null;

  const allLogs = (logsResult.data ?? []) as HealthLog[];

  // Compute the user's per-metric target zone (preferences override defaults)
  const targetFor = (m: MetricKey) => {
    if (m === 'blood_sugar' && prefs) {
      return {
        min: prefs.target_blood_sugar_min,
        max: prefs.target_blood_sugar_max,
      };
    }
    if (m === 'weight' && prefs?.target_weight_kg) {
      const t = prefs.target_weight_kg;
      // ±3kg band around the user's target
      return { min: Math.round((t - 3) * 10) / 10, max: Math.round((t + 3) * 10) / 10 };
    }
    return METRIC_DEFAULT_TARGET[m];
  };

  // Build summary cards for the 3 tabs (always from full 90-day window)
  const summaries: { key: MetricKey; latest: number | null; previous: number | null; count: number }[] =
    (['blood_sugar', 'weight', 'pressure'] as MetricKey[]).map((m) => {
      const vals = allLogs
        .map((r) => valueOf(m, r))
        .filter((v): v is number => v !== null);
      return {
        key: m,
        latest: vals.length > 0 ? vals[vals.length - 1] : null,
        previous: vals.length > 1 ? vals[0] : null,
        count: vals.length,
      };
    });

  // Filter to the active range for the chart / entries / summary
  const cutoff = Date.now() - range * 86400000;
  const rangeLogs = allLogs.filter(
    (r) =>
      new Date(r.logged_at).getTime() >= cutoff && valueOf(metric, r) !== null
  );

  const target = targetFor(metric);
  const meta = METRIC_LABELS[metric];

  const chartPoints = rangeLogs.map((r) => ({
    loggedAt: r.logged_at,
    value: valueOf(metric, r) as number,
  }));

  // Entries list — newest first, last 8
  const entries: LogEntry[] = rangeLogs
    .slice()
    .reverse()
    .slice(0, 8)
    .map((r) => {
      const v = valueOf(metric, r) as number;
      const zone = zoneOf(v, target.min, target.max);
      return {
        id: r.id,
        value: v,
        unit: meta.unit,
        loggedAt: r.logged_at,
        zone,
        notes: r.notes,
      };
    });

  // Summary stats
  const vals = chartPoints.map((p) => p.value);
  const count = vals.length;
  const average = count > 0 ? vals.reduce((a, b) => a + b, 0) / count : null;
  const min = count > 0 ? Math.min(...vals) : null;
  const max = count > 0 ? Math.max(...vals) : null;
  const inZone = vals.filter((v) => v >= target.min && v <= target.max).length;
  const inZonePct = count > 0 ? Math.round((inZone / count) * 100) : null;
  const trendPct =
    count > 1 && vals[0] !== 0
      ? ((vals[count - 1] - vals[0]) / vals[0]) * 100
      : null;

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik' : 'Hoïs Bazilik';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  const commentary = buildCommentary({
    metric,
    count,
    trendPct,
    inZonePct,
    unit: meta.unit,
  });

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1280px]">
        <header className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Activity className="w-3.5 h-3.5" strokeWidth={2.2} />
            Swivi Sante
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Mezi <em className="text-forest-600 not-italic font-bold">w yo</em>
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl">
            Anrejistre mezi ou chak jou pou konstwi istwa pwogrè w. Plan ou a ajiste selon rezilta ak evolisyon ou.
          </p>
        </header>

        {/* Objektif sante — moved here from settings so the member sees
            what they're working toward right above their numbers. */}
        <div className="mb-5">
          {healthGoal ? (
            <div className="flex items-center gap-3 rounded-2xl border border-forest-200 bg-gradient-to-r from-forest-50 to-white px-4 py-3.5 md:px-5">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 text-cream-50 shrink-0 shadow-plant">
                <Target className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-bold">
                  Objektif sante ou
                </div>
                <div className="font-display text-lg font-bold text-ink leading-tight truncate">
                  {HEALTH_GOAL_LABELS[healthGoal] ?? 'Objektif pèsonèl'}
                </div>
                {healthGoal === 'other' && healthGoalOther && (
                  <p className="text-xs text-earth-600 mt-0.5 line-clamp-2">
                    {healthGoalOther}
                  </p>
                )}
              </div>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800 border border-forest-200 hover:border-forest-300 rounded-lg transition shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span className="hidden sm:inline">Modifye</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 px-4 py-3.5 md:px-5 hover:border-forest-300 hover:bg-forest-50/40 transition group"
            >
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-cream-100 text-earth-500 group-hover:bg-forest-100 group-hover:text-forest-700 shrink-0 transition">
                <Target className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink text-sm">
                  Defini yon objektif sante
                </div>
                <p className="text-xs text-earth-600 mt-0.5">
                  Sa ap ede Ekip Hoïs la pèsonalize konsèy ak rekòmandasyon yo pou ou.
                </p>
              </div>
              <span className="text-xs font-semibold text-forest-700 shrink-0">
                Mete youn →
              </span>
            </Link>
          )}
        </div>

        <div className="mb-5">
          <ConditionsStrip conditions={conditions} activeMetric={metric} />
        </div>

        <MetricTabs active={metric} summaries={summaries} />

        {/* Chart card */}
        <section className="mt-6 bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Evolisyon <em className="text-forest-600 not-italic font-bold">{meta.label.toLowerCase()}</em>
              </h2>
              <p className="text-xs text-earth-600 mt-0.5 inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3" strokeWidth={2.2} />
                {count > 0 ? `${count} mezi` : 'Pa gen mezi'} · sib {target.min}–{target.max} {meta.unit}
              </p>
            </div>
            <RangeChips active={range} />
          </div>
          <HealthLineChart
            points={chartPoints}
            targetMin={target.min}
            targetMax={target.max}
            unit={meta.unit}
            rangeDays={range}
          />
        </section>

        {/* Two-column bottom row */}
        <div className="mt-6 grid lg:grid-cols-2 gap-5 md:gap-6">
          {/* Left — log form + recent entries */}
          <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <header className="mb-4">
              <h2 className="font-display text-lg font-bold text-ink">
                Ajoute <em className="text-forest-600 not-italic font-bold">yon mezi</em>
              </h2>
              <p className="text-xs text-earth-600 mt-0.5">
               Mete mezi ou yo ajou regilyèman pou plan an ka pi byen adapte ak evolisyon ou.
              </p>
            </header>

            <LogForm metric={metric} />

            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-earth-500 font-semibold mb-2">
                Dènye mezi yo
              </div>
              <LogEntries
                entries={entries}
                targetMin={target.min}
                targetMax={target.max}
              />
            </div>
          </section>

          {/* Right — summary + commentary + export */}
          <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <header className="mb-4">
              <h2 className="font-display text-lg font-bold text-ink">
                Rezime <em className="text-forest-600 not-italic font-bold">peryòd la</em>
              </h2>
              <p className="text-xs text-earth-600 mt-0.5">
                {range} Dènye aktivite: Jodi a. Kenbe rit la; evite sote yon jou.
              </p>
            </header>

            <HealthSummary
              unit={meta.unit}
              count={count}
              average={average}
              min={min}
              max={max}
              inZonePct={inZonePct}
              trendPct={trendPct}
              commentary={commentary}
            />

            <div className="mt-5 pt-5 border-t border-cream-200">
              <ExportCsvButton />
            </div>
          </section>
        </div>

        {/* Treatments / prescriptions from admin / herbalist */}
        <div className="mt-6">
          <TreatmentsSection treatments={treatments} />
        </div>

        {/* Consultations — bookings now happen on
            medikaplantshop.com/consultation. Panel is a pure outbound CTA. */}
        <div className="mt-6">
          <ConsultationsPanel />
        </div>
      </div>
    </>
  );
}

function zoneOf(v: number, min: number, max: number): 'ok' | 'warn' | 'bad' {
  if (v >= min && v <= max) return 'ok';
  // 10% slack before flipping to "bad"
  if (v > max * 1.1 || v < min * 0.9) return 'bad';
  return 'warn';
}

function buildCommentary({
  metric,
  count,
  trendPct,
  inZonePct,
  unit,
}: {
  metric: MetricKey;
  count: number;
  trendPct: number | null;
  inZonePct: number | null;
  unit: string;
}): { body: string; author: string } | null {
  if (count < 3 || trendPct === null) return null;
  const author = 'Mèt Joseph, èrboris santiniye';
  const noun =
    metric === 'blood_sugar'
      ? 'sik nan san'
      : metric === 'weight'
      ? 'pwa'
      : 'tansyon';
  const direction = trendPct < 0 ? 'bese' : trendPct > 0 ? 'monte' : 'estab';
  const goodTrend = trendPct < 0; // lower is better for all 3 metrics
  const abs = Math.abs(trendPct).toFixed(1);

  if (goodTrend && (inZonePct ?? 0) >= 60) {
    return {
      body: `${noun.charAt(0).toUpperCase() + noun.slice(1)} ou ${direction} ${abs}% depi ou kòmanse, e ${inZonePct}% mezi yo nan zòn sib la. Kontinye ak tizan maten an — sa fonksyone.`,
      author,
    };
  }
  if (goodTrend) {
    return {
      body: `${noun.charAt(0).toUpperCase() + noun.slice(1)} ou ${direction} ${abs}%. Bon dirèksyon — kontinye note chak jou, e ekri m si w gen yon kesyon.`,
      author,
    };
  }
  return {
    body: `${noun.charAt(0).toUpperCase() + noun.slice(1)} ou ${direction} ${abs}% dènyèman. Pa enkyete w — ann gade ansanm si gen yon ajisteman pou nou fè nan plan an.`,
    author,
  };
}
