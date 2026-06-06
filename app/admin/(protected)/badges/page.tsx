import Link from 'next/link';
import { Award, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import BadgeArt from '@/components/dashboard/badge-art';
import BadgeActiveToggle from './badge-active-toggle';
import { asBadgeIcon, METRIC_LABEL, METRIC_UNIT } from '@/lib/badges/metric-helpers';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Badj' };
export const dynamic = 'force-dynamic';

type BadgeRow = Database['public']['Tables']['badges']['Row'];

export default async function AdminBadgesPage() {
  const supabase = createClient();

  // Pull all badges (incl. inactive) + per-badge unlock counts.
  const [badgesResult, countsResult] = await Promise.all([
    supabase
      .from('badges')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('user_badges')
      .select('badge_id, unlocked')
      .eq('unlocked', true),
  ]);

  const badges = (badgesResult.data ?? []) as BadgeRow[];
  const unlockedRows = (countsResult.data ?? []) as Array<{
    badge_id: string;
    unlocked: boolean;
  }>;
  const unlockedCountByBadge = new Map<string, number>();
  for (const row of unlockedRows) {
    unlockedCountByBadge.set(
      row.badge_id,
      (unlockedCountByBadge.get(row.badge_id) ?? 0) + 1
    );
  }

  const activeCount = badges.filter((b) => b.active).length;
  const totalUnlocks = unlockedRows.length;

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Badj
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Jere badj manm yo
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Edit non, sub-tit, deskripsyon, sèyi (threshold), ak vizibilite
          badj yo. Slug la ak metric la pa ka chanje paske yo konekte ak
          fonksyon SQL ki kalkile pwogresyon an. Yon badj inaktif disparèt
          nan galri manm yo san efase istwa.
        </p>
      </header>

      {/* Stat strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-7">
        <Stat label="Total badj" value={badges.length.toString()} />
        <Stat label="Aktif" value={activeCount.toString()} tone="forest" />
        <Stat
          label="Inaktif"
          value={(badges.length - activeCount).toString()}
          tone="rose"
        />
        <Stat
          label="Total debloke"
          value={totalUnlocks.toString()}
          tone="gold"
        />
      </section>

      {/* Badge list */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-cream-200 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">
            Tout badj ({badges.length})
          </h2>
        </header>

        {badges.length === 0 ? (
          <div className="p-8 text-center text-sm text-earth-600">
            Pa gen okenn badj. Pou kreye yon nouvo badj, ajoute yon ranje
            nan tab <code>badges</code> avèk yon metrik ki sipòte nan
            fonksyon SQL{' '}
            <code>recompute_user_badges()</code>.
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {badges.map((b) => {
              const unlocks = unlockedCountByBadge.get(b.id) ?? 0;
              const icon = asBadgeIcon(b.icon);
              const metricLabel =
                METRIC_LABEL[
                  b.criteria_metric as keyof typeof METRIC_LABEL
                ] ?? b.criteria_metric;
              const unit =
                METRIC_UNIT[
                  b.criteria_metric as keyof typeof METRIC_UNIT
                ] ?? '';

              return (
                <li
                  key={b.id}
                  className="p-4 md:p-5 flex items-start gap-4 hover:bg-cream-50/40 transition"
                >
                  <div className="shrink-0 pt-1">
                    <BadgeArt icon={icon} unlocked={b.active} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display text-base md:text-lg font-bold text-ink truncate">
                        {b.name}
                      </span>
                      <span className="text-[10px] font-mono text-earth-500">
                        #{b.display_order}
                      </span>
                      {b.active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                          <CheckCircle2
                            className="w-2.5 h-2.5"
                            strokeWidth={2.4}
                          />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          <XCircle
                            className="w-2.5 h-2.5"
                            strokeWidth={2.4}
                          />
                          Inaktif
                        </span>
                      )}
                    </div>

                    {b.sub && (
                      <div className="text-xs text-earth-600 mb-1">
                        {b.sub}
                      </div>
                    )}
                    {b.description && (
                      <p className="text-xs text-earth-700 line-clamp-2 max-w-2xl">
                        {b.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-earth-600 flex-wrap">
                      <span>
                        <span className="text-earth-500">Mezi:</span>{' '}
                        <span className="font-mono text-ink">
                          {metricLabel}
                        </span>
                      </span>
                      <span>
                        <span className="text-earth-500">Sèyi:</span>{' '}
                        <span className="font-mono text-ink">
                          {b.criteria_threshold} {unit}
                        </span>
                      </span>
                      <span>
                        <span className="text-earth-500">Debloke pa:</span>{' '}
                        <span className="font-mono text-ink">{unlocks}</span>{' '}
                        manm
                      </span>
                      <span className="text-earth-400">·</span>
                      <span className="font-mono text-earth-500">
                        slug: {b.slug}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Link
                      href={`/admin/badges/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-cream-50 text-xs font-semibold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" strokeWidth={2.4} />
                      Edit
                    </Link>
                    <BadgeActiveToggle id={b.id} active={b.active} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'cream',
}: {
  label: string;
  value: string;
  tone?: 'cream' | 'forest' | 'rose' | 'gold';
}) {
  const toneStyles: Record<typeof tone, string> = {
    cream: 'bg-cream-50 border-cream-200 text-earth-800',
    forest: 'bg-forest-50 border-forest-200 text-forest-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    gold: 'bg-gold-50 border-gold-200 text-gold-800',
  } as const;
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 flex flex-col gap-1 ${toneStyles[tone]}`}
    >
      <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
        {label}
      </div>
      <div className="font-display text-2xl font-bold tracking-tight">
        {value}
      </div>
    </div>
  );
}
