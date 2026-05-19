'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowUpRight,
  XCircle,
  ShieldAlert,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cancelActiveSubscription } from '@/app/dashboard/settings/actions';

type Plan = 'basic' | 'premium' | 'vip';

const PLAN_LABELS: Record<Plan, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};
const PLAN_TAGLINES: Record<Plan, string> = {
  basic: 'Pòt antre nan inivè VIP la',
  premium: 'Plan ki pi popilè',
  vip: 'Eksperyans VIP ki pi konplè',
};
const PLAN_GRADIENTS: Record<Plan, string> = {
  basic: 'from-forest-600 to-forest-800',
  premium: 'from-teal-600 to-forest-800',
  vip: 'from-gold-500 to-forest-900',
};

const PLAN_ORDER: Plan[] = ['basic', 'premium', 'vip'];

export type SubscriptionInfo = {
  id: string | null;
  status: 'active' | 'cancelled' | 'expired' | null;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
};

export type PastSubscription = {
  id: string;
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  amount: number | null;
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('fr-HT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export default function PlanCard({
  currentPlan,
  subscription,
  pastSubscriptions,
}: {
  currentPlan: Plan;
  subscription: SubscriptionInfo;
  pastSubscriptions: PastSubscription[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [justCancelled, setJustCancelled] = React.useState(false);

  const planLabel = PLAN_LABELS[currentPlan];
  const tagline = PLAN_TAGLINES[currentPlan];
  const gradient = PLAN_GRADIENTS[currentPlan];

  const planIndex = PLAN_ORDER.indexOf(currentPlan);
  const upgradeTargets = PLAN_ORDER.slice(planIndex + 1);

  const hasActive = subscription.status === 'active';
  const endDate = subscription.end_date;
  const startDate = subscription.start_date;
  const totalDays = startDate && endDate ? daysBetween(startDate, endDate) : null;
  const elapsedDays = startDate
    ? daysBetween(startDate, new Date().toISOString())
    : null;
  const progressPct =
    totalDays && totalDays > 0 && elapsedDays !== null
      ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
      : null;

  async function onCancel() {
    setCancelling(true);
    setError(null);
    const res = await cancelActiveSubscription();
    setCancelling(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirming(false);
    setJustCancelled(true);
    // Re-run the server component so profile.plan, subscription badge,
    // upgrade options, and past subscriptions all reflect the new state.
    router.refresh();
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card overflow-hidden">
      <header className="mb-5">
        <h2 className="font-display text-lg md:text-xl font-bold text-ink">
          Plan & Abònman
        </h2>
        <p className="text-sm text-earth-600 mt-1">
          Jere plan ou ak istwa pèman.
        </p>
      </header>

      {/* Current plan hero */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 md:p-6 text-cream-50 bg-gradient-to-br',
          gradient
        )}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />

        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cream-50/15 text-[11px] font-semibold uppercase tracking-wide mb-3">
              <Sparkles className="w-3 h-3" strokeWidth={2.2} />
              Plan aktif
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight">
              {planLabel}
            </h3>
            <p className="text-sm text-cream-100/85 mt-1">{tagline}</p>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs text-cream-100/70 uppercase tracking-wider">
              Estati
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-50/15 text-sm font-semibold">
              {hasActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Aktif
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Pa aktif
                </>
              )}
            </div>
          </div>
        </div>

        {hasActive && startDate && (
          <div className="relative mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[11px] text-cream-100/70 uppercase tracking-wider">
                Kòmanse
              </div>
              <div className="font-semibold mt-0.5">{formatDate(startDate)}</div>
            </div>
            {endDate && (
              <div>
                <div className="text-[11px] text-cream-100/70 uppercase tracking-wider">
                  Fini
                </div>
                <div className="font-semibold mt-0.5">{formatDate(endDate)}</div>
              </div>
            )}
            {subscription.amount !== null && (
              <div>
                <div className="text-[11px] text-cream-100/70 uppercase tracking-wider">
                  Peye
                </div>
                <div className="font-semibold mt-0.5">${subscription.amount}</div>
              </div>
            )}
          </div>
        )}

        {progressPct !== null && hasActive && (
          <div className="relative mt-4">
            <div className="h-1.5 rounded-full bg-cream-50/15 overflow-hidden">
              <div
                className="h-full bg-cream-50/80 transition-[width] duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-cream-100/80 mt-1.5">
              <span>
                {progressPct}% peryòd la pase
              </span>
              {endDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={2.2} />
                  {totalDays !== null && elapsedDays !== null
                    ? `${Math.max(0, totalDays - elapsedDays)} jou rete`
                    : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {justCancelled && (
          <div className="relative mt-5 px-4 py-3 rounded-xl bg-cream-50/15 border border-cream-50/20 text-sm">
            <strong>Plan ou anile.</strong> Ou tounen sou plan Hoïs Bazilik.
            Refresh paj la pou wè dènye eta a.
          </div>
        )}
      </div>

      {/* Upgrade / Cancel actions */}
      {!justCancelled && (
        <div className="mt-5 grid gap-3">
          {upgradeTargets.length > 0 && (
            <div className="rounded-xl border border-gold-200 bg-gold-50/40 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold-600 font-semibold mb-1">
                    <ArrowUpRight className="w-3 h-3" strokeWidth={2.4} />
                    Pi gwo aksè
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    Pase sou yon plan ki pi wo
                  </div>
                  <div className="text-xs text-earth-600 mt-0.5">
                    Debloke plis resous, konsiltasyon ak avantaj VIP.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {upgradeTargets.map((target) => (
                    <Link
                      key={target}
                      href={`/checkout?plan=${target}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gold-400 hover:bg-gold-300 text-forest-900 rounded-lg transition"
                    >
                      Pase sou {PLAN_LABELS[target]}
                      <ArrowUpRight className="w-3 h-3" strokeWidth={2.4} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasActive && (
            <div className="rounded-xl border border-cream-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    Anile plan an
                  </div>
                  <div className="text-xs text-earth-600 mt-0.5 max-w-md">
                    Aksè VIP ou ap rete jiska {formatDate(endDate)} si w deja
                    peye. Apre sa ou ap tounen sou Hoïs Bazilik.
                  </div>
                </div>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition"
                  >
                    <XCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Anile plan
                  </button>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 w-full">
                    <div className="flex items-start gap-2 mb-3">
                      <ShieldAlert
                        className="w-4 h-4 text-rose-700 mt-0.5 shrink-0"
                        strokeWidth={2}
                      />
                      <p className="text-sm text-rose-900">
                        Èske w sèten ou vle anile {planLabel}? Lè ou anile, w ap
                        pèdi aksè a kontni VIP ou.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onCancel}
                        disabled={cancelling}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white rounded-lg transition"
                      >
                        {cancelling && (
                          <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
                        )}
                        Wi, anile
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={cancelling}
                        className="px-3 py-1.5 text-xs font-semibold text-earth-700 hover:text-ink transition"
                      >
                        Kenbe l
                      </button>
                    </div>
                    {error && (
                      <p className="mt-2 text-xs text-rose-700 inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" strokeWidth={2.4} /> {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasActive && currentPlan === 'basic' && (
            <div className="rounded-xl border border-forest-200 bg-forest-50/50 p-4 flex items-start gap-3 text-sm text-forest-900">
              <Sparkles
                className="w-4 h-4 mt-0.5 text-forest-700 shrink-0"
                strokeWidth={2.2}
              />
              <div>
                <strong>Ou sou plan gratis Hoïs Bazilik.</strong> Pase sou
                Sitwonèl oswa Melis pou debloke konsiltasyon ak resous VIP.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past subscriptions */}
      {pastSubscriptions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink mb-2">Istwa abònman</h3>
          <div className="rounded-xl border border-cream-200 overflow-hidden divide-y divide-cream-200">
            {pastSubscriptions.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold text-ink">{PLAN_LABELS[s.plan]}</div>
                  <div className="text-xs text-earth-600 mt-0.5">
                    {formatDate(s.start_date)} → {formatDate(s.end_date)}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                    s.status === 'active'
                      ? 'bg-forest-100 text-forest-700'
                      : s.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-cream-100 text-earth-700'
                  )}
                >
                  {s.status === 'active'
                    ? 'Aktif'
                    : s.status === 'cancelled'
                    ? 'Anile'
                    : 'Ekspire'}
                </span>
                <span className="hidden sm:inline text-right font-mono text-xs text-earth-700">
                  {s.amount !== null ? `$${s.amount}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
