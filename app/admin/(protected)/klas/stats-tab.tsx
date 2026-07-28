import {
  DollarSign,
  ShoppingCart,
  GraduationCap,
  TrendingUp,
  Gift,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AnalyticsCharts from './analytics-charts';

// ─── Types (raw rows from the page) ──────────────────────────────────────────

type CourseLite = {
  id: string;
  title: string;
  active: boolean;
  price_cents: number | null;
  seat_capacity: number | null;
};

type EnrollLite = {
  course_id: string;
  source: 'click' | 'purchase' | 'subscription' | 'admin_grant';
};

type PurchaseLite = {
  course_id: string;
  amount_cents: number;
  purchased_at: string;
};

// Short Kreyòl month labels for the timeline axis.
const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function StatsTab({
  courses,
  enrollments,
  purchases,
}: {
  courses: CourseLite[];
  enrollments: EnrollLite[];
  purchases: PurchaseLite[];
}) {
  // ── Aggregate money per course (paid purchases only — real revenue) ──
  const revByCourse = new Map<string, { revenue: number; buyers: number }>();
  for (const p of purchases) {
    const a = revByCourse.get(p.course_id) ?? { revenue: 0, buyers: 0 };
    a.revenue += p.amount_cents;
    a.buyers += 1;
    revByCourse.set(p.course_id, a);
  }

  // ── Aggregate enrolments per course, split by how access was granted ──
  const enrByCourse = new Map<
    string,
    { total: number; free: number; purchase: number; subscription: number }
  >();
  for (const e of enrollments) {
    const a =
      enrByCourse.get(e.course_id) ??
      { total: 0, free: 0, purchase: 0, subscription: 0 };
    a.total += 1;
    if (e.source === 'click' || e.source === 'admin_grant') a.free += 1;
    else if (e.source === 'purchase') a.purchase += 1;
    else if (e.source === 'subscription') a.subscription += 1;
    enrByCourse.set(e.course_id, a);
  }

  // ── Top-line KPIs ──
  const totalRevenue = purchases.reduce((s, p) => s + p.amount_cents, 0);
  const totalPurchases = purchases.length;
  const activeCourses = courses.filter((c) => c.active).length;
  const avgPerPurchase =
    totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0;

  // ── Per-course rows, richest first ──
  const rows = courses
    .map((c) => {
      const r = revByCourse.get(c.id) ?? { revenue: 0, buyers: 0 };
      const e =
        enrByCourse.get(c.id) ??
        { total: 0, free: 0, purchase: 0, subscription: 0 };
      return { ...c, revenue: r.revenue, buyers: r.buyers, enroll: e };
    })
    .sort((a, b) => b.revenue - a.revenue || a.title.localeCompare(b.title));

  // ── Chart-ready data (dollars, and only courses with real sales) ──
  const perCourse = rows
    .filter((r) => r.buyers > 0)
    .map((r) => ({
      name: r.title,
      revenue: +(r.revenue / 100).toFixed(2),
      buyers: r.buyers,
    }));

  // Last 6 months, oldest → newest, revenue bucketed by purchase month.
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS_HT[d.getMonth()],
      revenue: 0,
    };
  });
  const idxByKey = new Map(buckets.map((b, i) => [b.key, i]));
  for (const p of purchases) {
    const d = new Date(p.purchased_at);
    const idx = idxByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) buckets[idx].revenue += p.amount_cents;
  }
  const timeline = buckets.map((b) => ({
    label: b.label,
    revenue: +(b.revenue / 100).toFixed(2),
  }));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={DollarSign}
          tone="forest"
          label="Revni total (kou)"
          value={money(totalRevenue)}
          hint="Sèlman acha peye — Stripe"
        />
        <KpiCard
          icon={ShoppingCart}
          tone="gold"
          label="Acha peye"
          value={String(totalPurchases)}
          hint="Kantite vant reyèl"
        />
        <KpiCard
          icon={GraduationCap}
          tone="clay"
          label="Kou aktif"
          value={String(activeCourses)}
          hint={`sou ${courses.length} kou total`}
        />
        <KpiCard
          icon={TrendingUp}
          tone="sky"
          label="Mwayèn pa acha"
          value={money(avgPerPurchase)}
          hint="Pri mwayen yon vant"
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts perCourse={perCourse} timeline={timeline} />

      {/* Per-course breakdown table */}
      <section className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
        <header className="px-4 md:px-5 py-3.5 border-b border-cream-200">
          <h3 className="font-display text-sm font-bold text-ink">
            Detay pa kou
          </h3>
          <p className="text-[11px] text-earth-600 mt-0.5">
            Acha peye = kòb reyèl. Enskripsyon ka gratis (ofè/admin) oswa atravè
            yon plan.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-earth-600 bg-cream-50">
                <th className="px-4 py-2.5 font-semibold">Kou</th>
                <th className="px-3 py-2.5 font-semibold text-right">Acha peye</th>
                <th className="px-3 py-2.5 font-semibold text-right">Revni</th>
                <th className="px-3 py-2.5 font-semibold text-right">Enskri</th>
                <th className="px-3 py-2.5 font-semibold">Ladan yo</th>
                <th className="px-3 py-2.5 font-semibold text-right">Plas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-cream-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink truncate max-w-[220px]">
                        {r.title}
                      </span>
                      {!r.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-earth-700 shrink-0">
                          Pa pibliye
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-forest-700">
                    {r.buyers}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">
                    {r.revenue > 0 ? money(r.revenue) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-earth-700">
                    {r.enroll.total}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.enroll.free > 0 && (
                        <SourceChip icon={Gift} tone="amber">
                          {r.enroll.free} gratis
                        </SourceChip>
                      )}
                      {r.enroll.subscription > 0 && (
                        <SourceChip icon={CreditCard} tone="sky">
                          {r.enroll.subscription} plan
                        </SourceChip>
                      )}
                      {r.enroll.purchase > 0 && (
                        <SourceChip icon={ShoppingCart} tone="forest">
                          {r.enroll.purchase} acha
                        </SourceChip>
                      )}
                      {r.enroll.total === 0 && (
                        <span className="text-earth-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-earth-700 whitespace-nowrap">
                    {r.seat_capacity === null
                      ? `${r.enroll.total} · san limit`
                      : `${r.enroll.total} / ${r.seat_capacity}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Small presentational pieces ─────────────────────────────────────────────

const TONE: Record<string, string> = {
  forest: 'bg-forest-100 text-forest-700',
  gold: 'bg-gold-100 text-gold-700',
  clay: 'bg-orange-100 text-orange-700',
  sky: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-800',
};

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof DollarSign;
  tone: keyof typeof TONE | string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            'grid place-items-center w-8 h-8 rounded-lg',
            TONE[tone] ?? TONE.forest
          )}
        >
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <span className="text-[11px] font-semibold text-earth-600 leading-tight">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl font-bold text-ink tracking-tight">
        {value}
      </div>
      {hint && <p className="text-[11px] text-earth-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function SourceChip({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Gift;
  tone: keyof typeof TONE;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        TONE[tone]
      )}
    >
      <Icon className="w-3 h-3" strokeWidth={2.2} />
      {children}
    </span>
  );
}
