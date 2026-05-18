import { Droplet, Scale, Target } from 'lucide-react';
import Sparkline from './sparkline';
import Radial from './radial';

type StatsRowProps = {
  bloodSugar: {
    value: number | null;
    target: string;
    deltaPct: number | null;
    spark: number[];
  };
  weight: {
    value: number | null;
    target: string;
    deltaKg: number | null;
    spark: number[];
  };
  dailyGoal: {
    percent: number;
    doneToday: number;
    totalToday: number;
    deltaVsYesterday?: number;
  };
};

export default function StatsRow({
  bloodSugar,
  weight,
  dailyGoal,
}: StatsRowProps) {
  const remaining = Math.max(0, dailyGoal.totalToday - dailyGoal.doneToday);

  return (
    <section className="grid md:grid-cols-3 gap-4 md:gap-5">
      {/* Blood sugar */}
      <StatCard
        label="Sik nan san"
        target={`Sib: ${bloodSugar.target}`}
        icon={<Droplet className="w-4 h-4" strokeWidth={2} />}
        iconBg="bg-forest-100 text-forest-700"
      >
        <div className="flex items-end gap-1">
          <span className="font-display text-4xl font-bold text-ink leading-none">
            {bloodSugar.value !== null ? Math.round(bloodSugar.value) : '—'}
          </span>
          <span className="text-xs text-earth-600 mb-1">mg/dL</span>
        </div>
        <div className="flex items-end justify-between gap-3 mt-3">
          {bloodSugar.deltaPct !== null && (
            <Delta
              tone={bloodSugar.deltaPct <= 0 ? 'good' : 'bad'}
              text={`${bloodSugar.deltaPct <= 0 ? '↓' : '↑'} ${Math.abs(
                bloodSugar.deltaPct
              ).toFixed(1)}%`}
              subtext="depi semèn pase"
            />
          )}
          <Sparkline values={bloodSugar.spark} tone="forest" />
        </div>
      </StatCard>

      {/* Weight */}
      <StatCard
        label="Pwa kò"
        target={`Sib: ${weight.target}`}
        icon={<Scale className="w-4 h-4" strokeWidth={2} />}
        iconBg="bg-earth-400/20 text-earth-600"
      >
        <div className="flex items-end gap-1">
          <span className="font-display text-4xl font-bold text-ink leading-none">
            {weight.value !== null ? weight.value.toFixed(1) : '—'}
          </span>
          <span className="text-xs text-earth-600 mb-1">kg</span>
        </div>
        <div className="flex items-end justify-between gap-3 mt-3">
          {weight.deltaKg !== null && (
            <Delta
              tone={weight.deltaKg <= 0 ? 'good' : 'bad'}
              text={`${weight.deltaKg <= 0 ? '↓' : '↑'} ${Math.abs(
                weight.deltaKg
              ).toFixed(1)} kg`}
              subtext="sa fè 7 jou"
            />
          )}
          <Sparkline values={weight.spark} tone="earth" />
        </div>
      </StatCard>

      {/* Daily goal */}
      <StatCard
        label="Objektif jou a"
        target={`100% jodi a`}
        icon={<Target className="w-4 h-4" strokeWidth={2} />}
        iconBg="bg-gold-100 text-gold-600"
      >
        <div className="flex items-center gap-4 mt-1">
          <Radial value={dailyGoal.percent} size={86} />
          <div>
            <div className="text-sm font-semibold text-ink">
              {dailyGoal.doneToday} sou {dailyGoal.totalToday} fini
            </div>
            <div className="text-xs text-earth-600 mt-0.5">
              {remaining} aktivite ankò
            </div>
            {dailyGoal.deltaVsYesterday !== undefined && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full">
                  {dailyGoal.deltaVsYesterday >= 0 ? '+' : ''}
                  {dailyGoal.deltaVsYesterday} vs yè
                </span>
              </div>
            )}
          </div>
        </div>
      </StatCard>
    </section>
  );
}

function StatCard({
  label,
  target,
  icon,
  iconBg,
  children,
}: {
  label: string;
  target: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card hover:shadow-cardHover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-earth-600 font-semibold">
            {label}
          </div>
          <div className="text-[11px] text-earth-500 mt-0.5">{target}</div>
        </div>
        <span className={`grid place-items-center w-8 h-8 rounded-lg ${iconBg}`}>
          {icon}
        </span>
      </div>
      {children}
    </div>
  );
}

function Delta({
  tone,
  text,
  subtext,
}: {
  tone: 'good' | 'bad';
  text: string;
  subtext?: string;
}) {
  return (
    <div>
      <span
        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
          tone === 'good'
            ? 'bg-forest-100 text-forest-700'
            : 'bg-rose-100 text-rose-700'
        }`}
      >
        {text}
      </span>
      {subtext && (
        <div className="text-[10px] text-earth-500 mt-1">{subtext}</div>
      )}
    </div>
  );
}
