import Link from 'next/link';
import { Droplet, HeartPulse, Scale, Target, Activity, ArrowRight } from 'lucide-react';
import Sparkline from '../sparkline';
import Radial from '../radial';
import type { PrimaryMetric } from '@/lib/dashboard/personalization';

type LogRow = {
  blood_sugar: number | null;
  weight: number | null;
  blood_pressure_systolic: number | null;
  logged_at: string;
};

const METRIC_META: Record<
  PrimaryMetric,
  {
    label: string;
    unit: string;
    target: string;
    Icon: typeof Droplet;
    iconBg: string;
    sparkTone: 'forest' | 'earth' | 'gold';
    pick: (l: LogRow) => number | null;
    /** lower is better (sugar, weight, BP) → down arrow is "good" */
    lowerIsBetter: boolean;
  }
> = {
  blood_sugar: {
    label: 'Sik nan san',
    unit: 'mg/dL',
    target: '70 – 130',
    Icon: Droplet,
    iconBg: 'bg-forest-100 text-forest-700',
    sparkTone: 'forest',
    pick: (l) => l.blood_sugar,
    lowerIsBetter: true,
  },
  pressure: {
    label: 'Tansyon (sistolik)',
    unit: 'mmHg',
    target: '100 – 130',
    Icon: HeartPulse,
    iconBg: 'bg-rose-100 text-rose-700',
    sparkTone: 'earth',
    pick: (l) => l.blood_pressure_systolic,
    lowerIsBetter: true,
  },
  weight: {
    label: 'Pwa kò',
    unit: 'kg',
    target: '—',
    Icon: Scale,
    iconBg: 'bg-earth-400/20 text-earth-600',
    sparkTone: 'earth',
    pick: (l) => l.weight,
    lowerIsBetter: true,
  },
};

const METRIC_PARAM: Record<PrimaryMetric, string> = {
  blood_sugar: 'blood_sugar',
  pressure: 'pressure',
  weight: 'weight',
};

/**
 * Smart metric spotlight (the "A" in B+A). Shows the ONE metric that
 * matters for this member's condition/goal, plus the daily-goal radial.
 * Uses only REAL logged values — when there's no data yet it shows an
 * honest "log your first measure" CTA instead of fabricated sparklines.
 */
export default function AdaptiveMetrics({
  primaryMetric,
  logs,
  dailyGoal,
}: {
  primaryMetric: PrimaryMetric;
  logs: LogRow[];
  dailyGoal: { percent: number; doneToday: number; totalToday: number };
}) {
  const meta = METRIC_META[primaryMetric];

  // Oldest → newest for the sparkline; keep only real numeric values.
  const series = [...logs]
    .reverse()
    .map(meta.pick)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const hasData = series.length >= 1;
  const latest = hasData ? series[series.length - 1] : null;
  const first = hasData ? series[0] : null;
  const deltaPct =
    series.length >= 2 && first && first !== 0
      ? ((series[series.length - 1] - first) / first) * 100
      : null;

  const remaining = Math.max(0, dailyGoal.totalToday - dailyGoal.doneToday);

  return (
    <section className="grid md:grid-cols-2 gap-4 md:gap-5">
      {/* Primary metric spotlight */}
      <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-earth-600 font-semibold">
              {meta.label}
            </div>
            <div className="text-[11px] text-earth-500 mt-0.5">
              {meta.target !== '—' ? `Sib: ${meta.target} ${meta.unit}` : 'Swivi w'}
            </div>
          </div>
          <span className={`grid place-items-center w-8 h-8 rounded-lg ${meta.iconBg}`}>
            <meta.Icon className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>

        {hasData ? (
          <>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold text-ink leading-none">
                {primaryMetric === 'weight'
                  ? latest!.toFixed(1)
                  : Math.round(latest!)}
              </span>
              <span className="text-xs text-earth-600 mb-1">{meta.unit}</span>
            </div>
            <div className="flex items-end justify-between gap-3 mt-3">
              {deltaPct !== null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (deltaPct <= 0) === meta.lowerIsBetter
                      ? 'bg-forest-100 text-forest-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {deltaPct <= 0 ? '↓' : '↑'} {Math.abs(deltaPct).toFixed(1)}%
                </span>
              )}
              <Sparkline values={series} tone={meta.sparkTone} />
            </div>
          </>
        ) : (
          <Link
            href={`/dashboard/health?metric=${METRIC_PARAM[primaryMetric]}`}
            className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-cream-300 bg-cream-50/50 hover:bg-forest-50/40 hover:border-forest-300 p-4 transition group"
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-cream-100 text-earth-500 group-hover:bg-forest-100 group-hover:text-forest-700 shrink-0 transition">
              <Activity className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">
                Anrejistre 1ye mezi ou
              </div>
              <div className="text-[11px] text-earth-600">
                Chif yo ap parèt isit la kou ou kòmanse swiv.
              </div>
            </div>
            <ArrowRight
              className="w-4 h-4 text-forest-700 shrink-0 group-hover:translate-x-0.5 transition"
              strokeWidth={2.4}
            />
          </Link>
        )}
      </div>

      {/* Daily goal radial */}
      <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-earth-600 font-semibold">
              Objektif jou a
            </div>
            <div className="text-[11px] text-earth-500 mt-0.5">100% jodi a</div>
          </div>
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-gold-100 text-gold-600">
            <Target className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <Radial value={dailyGoal.percent} size={86} />
          <div>
            <div className="text-sm font-semibold text-ink">
              {dailyGoal.doneToday} sou {dailyGoal.totalToday} fini
            </div>
            <div className="text-xs text-earth-600 mt-0.5">
              {remaining > 0
                ? `${remaining} aktivite ankò`
                : dailyGoal.totalToday > 0
                  ? 'Tout fini — bèl travay! 🌿'
                  : 'Pa gen aktivite jodi a'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
