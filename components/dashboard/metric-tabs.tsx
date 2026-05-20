'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Droplet, Scale, Activity, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricKey = 'blood_sugar' | 'weight' | 'pressure';

type MetricSummary = {
  key: MetricKey;
  label: string;
  unit: string;
  icon: LucideIcon;
  latest: number | null;
  previous: number | null;
  count: number;
};

const ICONS: Record<MetricKey, LucideIcon> = {
  blood_sugar: Droplet,
  weight: Scale,
  pressure: Activity,
};

const LABELS: Record<MetricKey, { label: string; unit: string }> = {
  blood_sugar: { label: 'Sik nan san', unit: 'mg/dL' },
  weight: { label: 'Pwa kò', unit: 'kg' },
  pressure: { label: 'Tansyon', unit: 'mmHg' },
};

type Props = {
  active: MetricKey;
  summaries: Array<{
    key: MetricKey;
    latest: number | null;
    previous: number | null;
    count: number;
  }>;
};

export default function MetricTabs({ active, summaries }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pick(metric: MetricKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('metric', metric);
    startTransition(() => {
      router.push(`/dashboard/health?${params.toString()}`, { scroll: false });
    });
  }

  const cards: MetricSummary[] = summaries.map((s) => ({
    ...s,
    label: LABELS[s.key].label,
    unit: LABELS[s.key].unit,
    icon: ICONS[s.key],
  }));

  return (
    <div
      role="tablist"
      aria-label="Mezi sante yo"
      className={cn(
        'grid sm:grid-cols-3 gap-3 md:gap-4 transition-opacity',
        pending && 'opacity-60'
      )}
    >
      {cards.map((c) => {
        const isActive = c.key === active;
        const delta =
          c.latest !== null && c.previous !== null && c.previous !== 0
            ? ((c.latest - c.previous) / c.previous) * 100
            : null;
        const Icon = c.icon;
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => pick(c.key)}
            className={cn(
              'group text-left rounded-2xl p-5 border transition-all',
              isActive
                ? 'bg-forest-700 text-cream-50 border-forest-700 shadow-plant'
                : 'bg-white text-ink border-cream-200 hover:border-forest-300 shadow-card'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  'text-[10px] uppercase tracking-[0.18em] font-semibold',
                  isActive ? 'text-cream-200/80' : 'text-earth-500'
                )}
              >
                {c.label}
              </div>
              <div
                className={cn(
                  'grid place-items-center w-8 h-8 rounded-lg shrink-0',
                  isActive
                    ? 'bg-cream-50/15 text-gold-300'
                    : 'bg-forest-50 text-forest-700'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold leading-none">
                {c.latest !== null ? c.latest : '—'}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-cream-200/80' : 'text-earth-600'
                )}
              >
                {c.unit}
              </span>
            </div>
            <div
              className={cn(
                'mt-3 text-[11px] flex items-center gap-1',
                isActive ? 'text-cream-200/80' : 'text-earth-600'
              )}
            >
              {delta !== null && c.count > 1 ? (
                <>
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 font-bold',
                      isActive
                        ? delta < 0
                          ? 'text-gold-300'
                          : 'text-cream-50'
                        : delta < 0
                        ? 'text-forest-700'
                        : 'text-rose-700'
                    )}
                  >
                    {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                  </span>
                  <span>depi {c.count} mezi</span>
                </>
              ) : (
                <span>
                  {c.count === 0 ? 'Poko gen mezi' : `${c.count} mezi`}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
