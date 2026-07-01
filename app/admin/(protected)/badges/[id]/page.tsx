import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import BadgeArt from '@/components/dashboard/badge-art';
import BadgeEditForm from './badge-edit-form';
import { asBadgeIcon, METRIC_LABEL, METRIC_UNIT } from '@/lib/badges/metric-helpers';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

export const metadata = { title: 'Admin · Edit badj' };
export const dynamic = 'force-dynamic';

type BadgeRow = Database['public']['Tables']['badges']['Row'];

export default async function EditBadgePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const adminRole = (profileRaw as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(adminRole, 'manage_badges')) {
    redirect('/admin');
  }

  const [badgeResult, unlockedCountResult] = await Promise.all([
    supabase.from('badges').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('user_badges')
      .select('user_id', { count: 'exact', head: true })
      .eq('badge_id', params.id)
      .eq('unlocked', true),
  ]);

  const badge = (badgeResult.data ?? null) as BadgeRow | null;
  if (!badge) notFound();
  const unlocks = unlockedCountResult.count ?? 0;

  const icon = asBadgeIcon(badge.icon);
  const metricLabel =
    METRIC_LABEL[badge.criteria_metric as keyof typeof METRIC_LABEL] ??
    badge.criteria_metric;
  const unit =
    METRIC_UNIT[badge.criteria_metric as keyof typeof METRIC_UNIT] ?? '';

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[920px] mx-auto">
      <Link
        href="/admin/badges"
        className="inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 transition mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
        Tounen nan lis badj yo
      </Link>

      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Edit badj
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          {badge.name}
        </h1>
      </header>

      {/* Preview card */}
      <section className="bg-cream-50 border border-cream-200 rounded-2xl p-5 mb-6 flex items-center gap-5">
        <div className="scale-[1.5] origin-center">
          <BadgeArt icon={icon} unlocked={badge.active} />
        </div>
        <div className="text-xs text-earth-700 space-y-1">
          <div>
            <span className="text-earth-500">Slug:</span>{' '}
            <code className="font-mono text-ink">{badge.slug}</code>
          </div>
          <div>
            <span className="text-earth-500">Metric (jere pa SQL):</span>{' '}
            <code className="font-mono text-ink">{badge.criteria_metric}</code>
            <span className="text-earth-500"> → {metricLabel}</span>
          </div>
          <div>
            <span className="text-earth-500">Debloke pa:</span>{' '}
            <span className="font-mono text-ink">{unlocks}</span> manm
          </div>
        </div>
      </section>

      {/* Edit form */}
      <BadgeEditForm
        badge={badge}
        metricLabel={metricLabel}
        unit={unit}
      />

      {/* Frozen-fields explainer */}
      <section className="mt-6 rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-4 text-xs text-earth-700">
        <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold mb-1">
          Sa ou pa ka chanje
        </div>
        <ul className="space-y-1 list-disc pl-5">
          <li>
            <code>slug</code> — itilize nan URL paj detay la
            (<code>/dashboard/badges/{badge.slug}</code>).
          </li>
          <li>
            <code>criteria_metric</code> — kòde nan SQL{' '}
            <code>recompute_user_badges()</code>. Pou ajoute yon metric
            nouvo, ekri yon migrasyon.
          </li>
        </ul>
      </section>
    </div>
  );
}
