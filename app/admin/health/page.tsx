import Link from 'next/link';
import {
  Activity,
  Droplet,
  Scale,
  Search,
  Pill,
  ChevronRight,
  Users,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Swivi Sante' };
export const dynamic = 'force-dynamic';

const CONDITION_LABEL: Record<string, string> = {
  diabetes_type_1: 'Dyabèt T1',
  diabetes_type_2: 'Dyabèt T2',
  hypertension: 'Tansyon wo',
  hypotension: 'Tansyon ba',
  asthma: 'Opresyon',
  arthritis: 'Atrit',
  cholesterol: 'Kolestewòl',
  anemia: 'Anemi',
  thyroid: 'Tirowid',
  kidney: 'Ren',
  liver: 'Fwa',
  gastric: 'Dijesyon',
  migraine: 'Migrèn',
  depression: 'Depresyon',
  anxiety: 'Anksyete',
  insomnia: 'Pwoblèm somèy',
};

type Profile = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  plan: 'basic' | 'premium' | 'vip';
  avatar_url: string | null;
  created_at: string;
  suspended: boolean;
  role: 'user' | 'admin';
};

type Medical = { user_id: string; conditions: string[] };
type Log = {
  user_id: string;
  blood_sugar: number | null;
  weight: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  logged_at: string;
};
type Treatment = { user_id: string; status: string };

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) {
    const hours = Math.floor(diffMs / 3600000);
    if (hours <= 0) return 'kèk minit pase';
    return `${hours}è pase`;
  }
  if (days === 1) return 'yè';
  if (days < 7) return `${days} jou pase`;
  if (days < 30) return `${Math.floor(days / 7)} sem pase`;
  return `${Math.floor(days / 30)} mwa pase`;
}

export default async function AdminHealthListPage({
  searchParams,
}: {
  searchParams: { condition?: string; q?: string };
}) {
  const supabase = createClient();

  // /admin layout already enforces role=admin. We can read profiles directly
  // because the admin's RLS policy on profiles lets them see everyone.
  const [profilesResult, medicalResult, logsResult, treatmentsResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, full_name, first_name, last_name, email, plan, avatar_url, created_at, suspended, role'
        )
        .eq('role', 'user')
        .eq('suspended', false)
        .order('created_at', { ascending: false }),
      supabase.from('user_medical_info').select('user_id, conditions'),
      // 30-day window of logs — enough to identify "active" patients
      supabase
        .from('health_logs')
        .select(
          'user_id, blood_sugar, weight, blood_pressure_systolic, blood_pressure_diastolic, logged_at'
        )
        .gte('logged_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('logged_at', { ascending: false })
        .limit(2000),
      supabase
        .from('treatment_recommendations')
        .select('user_id, status'),
    ]);

  const profiles = (profilesResult.data ?? []) as Profile[];
  const medical = (medicalResult.data ?? []) as Medical[];
  const logs = (logsResult.data ?? []) as Log[];
  const treatments = (treatmentsResult.data ?? []) as Treatment[];

  // Build per-user state in one pass over the long lists
  const conditionsByUser = new Map<string, string[]>();
  for (const m of medical) conditionsByUser.set(m.user_id, m.conditions ?? []);

  type LatestLogs = {
    bs: { v: number; at: string } | null;
    wt: { v: number; at: string } | null;
    sys: { v: number; dia: number | null; at: string } | null;
    lastAt: string | null;
    count: number;
  };
  const latestByUser = new Map<string, LatestLogs>();
  // logs are pre-ordered desc by logged_at, so we take the first non-null
  // value per metric per user.
  for (const l of logs) {
    const cur =
      latestByUser.get(l.user_id) ??
      ({ bs: null, wt: null, sys: null, lastAt: null, count: 0 } as LatestLogs);
    if (l.blood_sugar != null && !cur.bs) {
      cur.bs = { v: l.blood_sugar, at: l.logged_at };
    }
    if (l.weight != null && !cur.wt) {
      cur.wt = { v: l.weight, at: l.logged_at };
    }
    if (l.blood_pressure_systolic != null && !cur.sys) {
      cur.sys = {
        v: l.blood_pressure_systolic,
        dia: l.blood_pressure_diastolic,
        at: l.logged_at,
      };
    }
    if (!cur.lastAt) cur.lastAt = l.logged_at;
    cur.count += 1;
    latestByUser.set(l.user_id, cur);
  }

  const treatmentsByUser = new Map<string, { active: number; total: number }>();
  for (const t of treatments) {
    const cur = treatmentsByUser.get(t.user_id) ?? { active: 0, total: 0 };
    cur.total += 1;
    if (t.status === 'active') cur.active += 1;
    treatmentsByUser.set(t.user_id, cur);
  }

  // Filter
  const conditionFilter = searchParams.condition?.toLowerCase();
  const queryFilter = searchParams.q?.toLowerCase().trim();

  let rows = profiles
    .map((p) => ({
      profile: p,
      conditions: conditionsByUser.get(p.id) ?? [],
      latest: latestByUser.get(p.id) ?? null,
      treatments: treatmentsByUser.get(p.id) ?? { active: 0, total: 0 },
    }))
    .filter((r) => {
      if (conditionFilter && !r.conditions.includes(conditionFilter)) return false;
      if (queryFilter) {
        const blob = `${r.profile.full_name ?? ''} ${r.profile.first_name ?? ''} ${r.profile.last_name ?? ''} ${r.profile.email}`.toLowerCase();
        if (!blob.includes(queryFilter)) return false;
      }
      return true;
    });

  // Sort: anyone with recent measurements first, then by recency
  rows.sort((a, b) => {
    const aAt = a.latest?.lastAt ? new Date(a.latest.lastAt).getTime() : 0;
    const bAt = b.latest?.lastAt ? new Date(b.latest.lastAt).getTime() : 0;
    return bAt - aAt;
  });

  // Stats
  const totalUsers = profiles.length;
  const activeTrackers = rows.filter((r) => (r.latest?.count ?? 0) > 0).length;
  const usersWithConditions = profiles.filter(
    (p) => (conditionsByUser.get(p.id)?.length ?? 0) > 0
  ).length;
  const totalActiveTreatments = Array.from(treatmentsByUser.values()).reduce(
    (sum, t) => sum + t.active,
    0
  );

  // Build distinct condition options for the filter dropdown — only show
  // those actually in use, plus the predefined catalog.
  const usedConditions = new Set<string>();
  for (const cs of conditionsByUser.values()) {
    for (const c of cs) usedConditions.add(c);
  }
  const conditionOptions = Array.from(usedConditions).sort();

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Activity className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Swivi Sante
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Pasyan & Mezi
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Swiv mezi sante manm yo an direk. Klike sou yon liy pou ouvri pwofil
          klinik konplè a epi pwopoze yon medikaman, tizan, oswa chanjman abitid.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Total manm"
          value={totalUsers}
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={Activity}
          label="Ki ap swiv mezi"
          value={activeTrackers}
          tone="bg-forest-100 text-forest-700"
        />
        <StatCard
          icon={AlertCircle}
          label="Ki gen kondisyon"
          value={usersWithConditions}
          tone="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={Pill}
          label="Tretman aktif"
          value={totalActiveTreatments}
          tone="bg-rose-100 text-rose-700"
        />
      </section>

      {/* Filters */}
      <form className="mb-5 flex flex-wrap items-center gap-2" action="/admin/health">
        <label className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
            strokeWidth={2}
          />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Chèche pa non oswa email…"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
          />
        </label>
        <select
          name="condition"
          defaultValue={searchParams.condition ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout kondisyon</option>
          {conditionOptions.map((c) => (
            <option key={c} value={c}>
              {CONDITION_LABEL[c] ?? c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-3 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
        >
          Filtre
        </button>
        {(searchParams.q || searchParams.condition) && (
          <Link
            href="/admin/health"
            className="text-xs font-semibold text-earth-700 hover:text-ink"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Table */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-earth-600">
            <Users className="w-8 h-8 text-earth-500 mx-auto mb-3" strokeWidth={1.6} />
            Pa gen pasyan ki matche filtè a.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
                <tr>
                  <th className="text-left px-5 py-3">Manm</th>
                  <th className="text-left px-3 py-3">Kondisyon</th>
                  <th className="text-left px-3 py-3">Dènye mezi</th>
                  <th className="text-left px-3 py-3">Tretman</th>
                  <th className="text-right px-5 py-3">Wè</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {rows.map((r) => (
                  <tr key={r.profile.id} className="hover:bg-cream-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/health/${r.profile.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <span className="grid place-items-center w-9 h-9 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0">
                          {(
                            r.profile.first_name?.[0] ??
                            r.profile.email?.[0] ??
                            'M'
                          ).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate group-hover:text-forest-700 transition">
                            {r.profile.full_name ||
                              [r.profile.first_name, r.profile.last_name]
                                .filter(Boolean)
                                .join(' ') ||
                              r.profile.email.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-earth-500 truncate">
                            {r.profile.email} · {r.profile.plan}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {r.conditions.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="text-[10px] font-semibold bg-cream-100 text-earth-700 border border-cream-200 rounded-full px-2 py-0.5"
                          >
                            {CONDITION_LABEL[c] ?? c.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {r.conditions.length > 3 && (
                          <span className="text-[10px] font-semibold text-earth-500">
                            +{r.conditions.length - 3}
                          </span>
                        )}
                        {r.conditions.length === 0 && (
                          <span className="text-[11px] text-earth-400 italic">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {r.latest && r.latest.count > 0 ? (
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-3 flex-wrap">
                            {r.latest.bs && (
                              <MetricChip
                                icon={Droplet}
                                label={`${r.latest.bs.v} mg/dL`}
                              />
                            )}
                            {r.latest.wt && (
                              <MetricChip
                                icon={Scale}
                                label={`${r.latest.wt.v} kg`}
                              />
                            )}
                            {r.latest.sys && (
                              <MetricChip
                                icon={Activity}
                                label={
                                  r.latest.sys.dia
                                    ? `${r.latest.sys.v}/${r.latest.sys.dia}`
                                    : `${r.latest.sys.v} mmHg`
                                }
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-earth-500">
                            {r.latest.lastAt && relativeLabel(r.latest.lastAt)} ·{' '}
                            {r.latest.count} mezi (30 jou)
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-earth-400 italic">
                          Pa gen mezi
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {r.treatments.active > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 text-[10px] font-bold uppercase tracking-wide">
                          <Pill className="w-3 h-3" strokeWidth={2.4} />
                          {r.treatments.active} aktif
                        </span>
                      ) : (
                        <span className="text-[11px] text-earth-400 italic">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/health/${r.profile.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"
                      >
                        Ouvri
                        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
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

function MetricChip({
  icon: Icon,
  label,
}: {
  icon: typeof Activity;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/85">
      <Icon className="w-3 h-3 text-forest-700" strokeWidth={2.2} />
      {label}
    </span>
  );
}
