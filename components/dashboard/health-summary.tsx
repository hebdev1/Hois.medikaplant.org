import { Sparkles, Activity, Target, type LucideIcon } from 'lucide-react';

type Props = {
  unit: string;
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  inZonePct: number | null;
  trendPct: number | null; // negative = improving for bs/weight/pressure
  commentary?: { body: string; author: string } | null;
};

export default function HealthSummary({
  unit,
  count,
  average,
  min,
  max,
  inZonePct,
  trendPct,
  commentary,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Mwayèn" value={average} unit={unit} tone="ink" />
        <StatBox
          label="Nan zòn"
          value={inZonePct}
          unit="%"
          tone={
            inZonePct === null
              ? 'ink'
              : inZonePct >= 70
              ? 'forest'
              : inZonePct >= 40
              ? 'gold'
              : 'rose'
          }
          icon={Target}
        />
        <StatBox label="Pi ba" value={min} unit={unit} tone="forest" />
        <StatBox label="Pi wo" value={max} unit={unit} tone="rose" />
      </div>

      {count > 1 && trendPct !== null && (
        <div className="rounded-xl bg-cream-50 border border-cream-200 p-3 flex items-center gap-3">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-forest-100 text-forest-700">
            <Activity className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <div className="flex-1 text-sm text-ink/90">
            Tandans:{' '}
            <strong
              className={
                trendPct < 0
                  ? 'text-forest-700'
                  : trendPct > 0
                  ? 'text-rose-700'
                  : 'text-earth-700'
              }
            >
              {trendPct === 0 ? '→' : trendPct < 0 ? '↓' : '↑'}{' '}
              {Math.abs(trendPct).toFixed(1)}%
            </strong>{' '}
            depi {count} mezi.
          </div>
        </div>
      )}

      {commentary && (
        <div className="rounded-2xl bg-gradient-to-br from-forest-50 to-cream-50 border border-forest-100 p-4">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-forest-700 mb-2">
            <Sparkles className="w-3 h-3" strokeWidth={2.2} />
            Konstatasyon
          </div>
          <p className="font-serif italic text-sm text-ink leading-relaxed">
            &ldquo;{commentary.body}&rdquo;
          </p>
          <p className="text-[11px] text-earth-600 mt-2">— {commentary.author}</p>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  unit: string;
  tone: 'ink' | 'forest' | 'gold' | 'rose';
  icon?: LucideIcon;
}) {
  const toneClass = {
    ink: 'text-ink',
    forest: 'text-forest-700',
    gold: 'text-gold-600',
    rose: 'text-rose-700',
  }[tone];

  return (
    <div className="rounded-xl bg-white border border-cream-200 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-earth-400" strokeWidth={2.2} />}
      </div>
      <div className="font-display text-xl font-bold leading-none flex items-baseline gap-1">
        <span className={toneClass}>
          {value === null ? '—' : Number.isInteger(value) ? value : value.toFixed(1)}
        </span>
        <span className="text-[10px] font-medium text-earth-500">{unit}</span>
      </div>
    </div>
  );
}
