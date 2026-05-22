import Link from 'next/link';
import {
  CreditCard,
  Search,
  TrendingUp,
  Sparkles,
  Ban,
  CalendarDays,
  Users as UsersIcon,
  Inbox,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import SubscriptionActions from './subscription-actions';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Abònman' };
export const dynamic = 'force-dynamic';

type SubRow = Database['public']['Tables']['subscriptions']['Row'];
type ProfileLite = {
  id: string;
  full_name: string | null;
  email: string;
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};
const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700 border-slate-200',
  premium: 'bg-teal-100 text-teal-700 border-teal-200',
  vip: 'bg-amber-100 text-amber-700 border-amber-200',
};
const PLAN_ACCENT: Record<string, string> = {
  basic: '#64748b',
  premium: '#0d9488',
  vip: '#c9a227',
};
const STATUS_TONE: Record<string, string> = {
  active: 'bg-forest-100 text-forest-700',
  cancelled: 'bg-rose-100 text-rose-700',
  expired: 'bg-cream-100 text-earth-700',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  cancelled: 'Anile',
  expired: 'Ekspire',
};

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `$${amount.toFixed(0)}`;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; status?: string };
}) {
  const supabase = createClient();

  const [subsResult, profilesResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email'),
  ]);

  const subs = (subsResult.data ?? []) as SubRow[];
  const profilesById = new Map<string, ProfileLite>(
    ((profilesResult.data ?? []) as ProfileLite[]).map((p) => [p.id, p])
  );

  // ── Stats (computed over ALL subs, ignoring filters) ────────────────────
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;

  const stats = {
    totalRevenue: subs.reduce((s, x) => s + (x.amount ?? 0), 0),
    activeCount: subs.filter((s) => s.status === 'active').length,
    thisMonthCount: subs.filter(
      (s) => new Date(s.created_at).getTime() > thirtyDaysAgo
    ).length,
    cancelledCount: subs.filter((s) => s.status === 'cancelled').length,
  };

  type PlanBreakdownRow = {
    plan: 'basic' | 'premium' | 'vip';
    label: string;
    activeCount: number;
    revenue: number;
    accent: string;
  };
  const planBreakdown: PlanBreakdownRow[] = (
    ['basic', 'premium', 'vip'] as const
  ).map((plan) => ({
    plan,
    label: PLAN_LABEL[plan],
    activeCount: subs.filter((s) => s.plan === plan && s.status === 'active')
      .length,
    revenue: subs
      .filter((s) => s.plan === plan)
      .reduce((sum, s) => sum + (s.amount ?? 0), 0),
    accent: PLAN_ACCENT[plan],
  }));

  // ── Filters ─────────────────────────────────────────────────────────────
  const qFilter = searchParams.q?.trim().toLowerCase();
  const planFilter = searchParams.plan;
  const statusFilter = searchParams.status;

  let rows = subs.map((s) => ({ sub: s, profile: profilesById.get(s.user_id) }));

  if (qFilter) {
    rows = rows.filter((r) => {
      const blob =
        `${r.profile?.full_name ?? ''} ${r.profile?.email ?? ''} ${r.sub.payment_reference ?? ''}`.toLowerCase();
      return blob.includes(qFilter);
    });
  }
  if (planFilter && ['basic', 'premium', 'vip'].includes(planFilter)) {
    rows = rows.filter((r) => r.sub.plan === planFilter);
  }
  if (
    statusFilter &&
    ['active', 'cancelled', 'expired'].includes(statusFilter)
  ) {
    rows = rows.filter((r) => r.sub.status === statusFilter);
  }

  const hasAnyFilter = Boolean(qFilter || planFilter || statusFilter);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Abònman
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Abònman <em className="text-forest-600 not-italic font-bold">manm yo</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Tout abònman yo nan baz done a — kreye nan paj checkout la oswa
          chanje manyèlman pa admin. Klike sou yon liy pou wè detay manm yo,
          oswa sèvi ak meni aksyon yo pou anile / ekstanjyone / make refonde.
        </p>
      </header>

      {/* Top stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={TrendingUp}
          label="Revni total"
          value={`$${stats.totalRevenue.toFixed(0)}`}
          tone="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={Sparkles}
          label="Aktif kounye a"
          value={`${stats.activeCount}`}
          tone="bg-forest-100 text-forest-700"
        />
        <StatCard
          icon={CalendarDays}
          label="Nouvo 30 jou"
          value={`${stats.thisMonthCount}`}
          tone="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={Ban}
          label="Anile"
          value={`${stats.cancelledCount}`}
          tone="bg-rose-100 text-rose-700"
        />
      </section>

      {/* Plan breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {planBreakdown.map((b) => (
          <div
            key={b.plan}
            className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card relative overflow-hidden"
          >
            <span
              aria-hidden
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: b.accent }}
            />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-earth-600">
                  Plan {b.label}
                </div>
                <div className="font-display text-3xl font-bold text-ink leading-none mt-1">
                  {b.activeCount}
                </div>
                <div className="text-[11px] text-earth-600 mt-1">
                  abònman aktif
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-bold text-earth-600">
                  Revni
                </div>
                <div
                  className="font-display text-xl font-bold leading-tight mt-1"
                  style={{ color: b.accent }}
                >
                  ${b.revenue.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <form
        action="/admin/subscriptions"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <label className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
            strokeWidth={2}
          />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Non, email, oswa referans pèman…"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
        </label>
        <select
          name="plan"
          defaultValue={searchParams.plan ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout plan</option>
          <option value="basic">Bazilik</option>
          <option value="premium">Sitwonèl</option>
          <option value="vip">Melis</option>
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout estati</option>
          <option value="active">Aktif</option>
          <option value="cancelled">Anile</option>
          <option value="expired">Ekspire</option>
        </select>
        <button
          type="submit"
          className="px-3 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
        >
          Filtre
        </button>
        {hasAnyFilter && (
          <Link
            href="/admin/subscriptions"
            className="text-xs font-semibold text-earth-700 hover:text-ink"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Table or empty state */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-cream-100 text-earth-500 mx-auto mb-3">
              <Inbox className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <div className="font-display text-lg font-bold text-ink">
              {hasAnyFilter
                ? 'Pa gen abònman ki matche filtè a.'
                : 'Poko gen okenn abònman.'}
            </div>
            <p className="text-sm text-earth-600 mt-1.5 max-w-md mx-auto">
              {hasAnyFilter
                ? 'Eseye yon lòt filtè oswa reset tout filtè yo.'
                : 'Lè manm yo achte yon plan nan paj checkout la, abònman yo ap parèt isit imedyatman.'}
            </p>
            {hasAnyFilter && (
              <Link
                href="/admin/subscriptions"
                className="inline-block mt-4 text-xs font-semibold text-forest-700 hover:text-forest-800"
              >
                Reset tout filtè →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
                <tr>
                  <th className="text-left px-5 py-3">Manm</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-right px-3 py-3">Montan</th>
                  <th className="text-left px-3 py-3">Kòmanse</th>
                  <th className="text-left px-3 py-3">Fini</th>
                  <th className="text-left px-3 py-3">Estati</th>
                  <th className="text-left px-3 py-3">Ref. pèman</th>
                  <th className="text-right px-5 py-3">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {rows.map(({ sub, profile }) => {
                  const name =
                    profile?.full_name ||
                    profile?.email?.split('@')[0] ||
                    sub.user_id.slice(0, 8);
                  const initials = (
                    profile?.full_name?.[0] ??
                    profile?.email?.[0] ??
                    'M'
                  ).toUpperCase();
                  return (
                    <tr key={sub.id} className="hover:bg-cream-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/users/${sub.user_id}`}
                          className="flex items-center gap-3 group"
                        >
                          <span className="grid place-items-center w-9 h-9 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate group-hover:text-forest-700 transition">
                              {name}
                            </div>
                            <div className="text-[11px] text-earth-500 truncate">
                              {profile?.email ?? '—'}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border',
                            PLAN_TONE[sub.plan]
                          )}
                        >
                          {PLAN_LABEL[sub.plan]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-ink font-semibold">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-700">
                        {formatDate(sub.start_date)}
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-700">
                        {formatDate(sub.end_date)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                            STATUS_TONE[sub.status]
                          )}
                        >
                          {STATUS_LABEL[sub.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <code className="text-[10px] text-earth-500 font-mono truncate inline-block max-w-[120px]">
                          {sub.payment_reference ?? '—'}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <SubscriptionActions
                          id={sub.id}
                          status={sub.status as 'active' | 'cancelled' | 'expired'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Total members count footer */}
      <footer className="mt-4 text-[11px] text-earth-500 flex items-center gap-1.5">
        <UsersIcon className="w-3 h-3" strokeWidth={2} />
        {rows.length} abònman ki montre · {subs.length} an total
      </footer>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex items-center gap-3">
      <span className={cn('grid place-items-center w-10 h-10 rounded-xl', tone)}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-earth-600 font-semibold">
          {label}
        </div>
        <div className="text-2xl font-bold text-ink leading-tight">{value}</div>
      </div>
    </div>
  );
}
