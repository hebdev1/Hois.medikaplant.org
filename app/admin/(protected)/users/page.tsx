import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Users,
  Search,
  Shield,
  Ban,
  Activity,
  Sparkles,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { ADMIN_ROLE_LABEL, hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Manm' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};
const PLAN_TONE: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  premium: 'bg-teal-100 text-teal-700',
  vip: 'bg-amber-100 text-amber-700',
};

type Profile = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  plan: 'basic' | 'premium' | 'vip';
  role: 'user' | 'admin';
  admin_role: AdminRole | null;
  suspended: boolean;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
};

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'jodi a';
  if (days === 1) return 'yè';
  if (days < 7) return `${days} jou pase`;
  if (days < 30) return `${Math.floor(days / 7)} sem pase`;
  if (days < 365) return `${Math.floor(days / 30)} mwa pase`;
  return `${Math.floor(days / 365)} an pase`;
}

export default async function AdminUsersListPage({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; role?: string; status?: string };
}) {
  const supabase = createClient();

  // Viewer admin_role — controls whether the "Ajoute admin" CTA appears
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) redirect('/admin/login');

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', viewer.id)
    .maybeSingle();
  const viewerAdminRole = (viewerProfile as { admin_role: AdminRole | null } | null)
    ?.admin_role;
  if (!hasCapability(viewerAdminRole, 'manage_users')) {
    redirect('/admin');
  }
  const viewerIsSuperAdmin = viewerAdminRole === 'super_admin';

  const [profilesResult, medicalResult, healthResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, full_name, first_name, last_name, email, plan, role, admin_role, suspended, avatar_url, city, country, created_at'
      )
      .order('created_at', { ascending: false }),
    supabase.from('user_medical_info').select('user_id, conditions'),
    supabase
      .from('health_logs')
      .select('user_id, logged_at')
      .gte('logged_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('logged_at', { ascending: false })
      .limit(5000),
  ]);

  const profiles = (profilesResult.data ?? []) as Profile[];
  const medical = (medicalResult.data ?? []) as Array<{
    user_id: string;
    conditions: string[];
  }>;
  const recentLogs = (healthResult.data ?? []) as Array<{
    user_id: string;
    logged_at: string;
  }>;

  const conditionsByUser = new Map<string, string[]>();
  for (const m of medical) conditionsByUser.set(m.user_id, m.conditions ?? []);
  const latestLogAtByUser = new Map<string, string>();
  for (const l of recentLogs) {
    if (!latestLogAtByUser.has(l.user_id)) {
      latestLogAtByUser.set(l.user_id, l.logged_at);
    }
  }

  // Filters
  const queryFilter = searchParams.q?.toLowerCase().trim();
  const planFilter = searchParams.plan;
  const roleFilter = searchParams.role;
  const statusFilter = searchParams.status; // 'active' | 'suspended'

  let rows = profiles
    .map((p) => ({
      profile: p,
      conditions: conditionsByUser.get(p.id) ?? [],
      lastLogAt: latestLogAtByUser.get(p.id) ?? null,
    }))
    .filter((r) => {
      if (queryFilter) {
        const blob =
          `${r.profile.full_name ?? ''} ${r.profile.first_name ?? ''} ${r.profile.last_name ?? ''} ${r.profile.email}`.toLowerCase();
        if (!blob.includes(queryFilter)) return false;
      }
      if (planFilter && r.profile.plan !== planFilter) return false;
      if (roleFilter && r.profile.role !== roleFilter) return false;
      if (statusFilter === 'suspended' && !r.profile.suspended) return false;
      if (statusFilter === 'active' && r.profile.suspended) return false;
      return true;
    });

  // Stats
  const stats = {
    total: profiles.length,
    admins: profiles.filter((p) => p.role === 'admin').length,
    suspended: profiles.filter((p) => p.suspended).length,
    active30: latestLogAtByUser.size,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" strokeWidth={2.2} />
            Admin · Manm
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Manm Hoïs Inivèsite
          </h1>
          <p className="mt-2 text-sm text-earth-600 max-w-2xl">
            Klike sou yon liy pou ouvri pwofil konplè a — modifye enfòmasyon
            pèsonèl, plan, kondisyon medikal, preferans, oswa voye yon
            notifikasyon dirèk.
          </p>
        </div>
        {viewerIsSuperAdmin && (
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition shrink-0"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2.2} />
            Ajoute yon admin
          </Link>
        )}
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Total" value={stats.total} tone="bg-slate-100 text-slate-700" />
        <StatCard icon={Activity} label="Aktif (30 jou)" value={stats.active30} tone="bg-forest-100 text-forest-700" />
        <StatCard icon={Shield} label="Admin" value={stats.admins} tone="bg-accent/10 text-accent" />
        <StatCard icon={Ban} label="Sispann" value={stats.suspended} tone="bg-rose-100 text-rose-700" />
      </section>

      {/* Filters */}
      <form action="/admin/users" className="mb-5 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" strokeWidth={2} />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Non, prenon, oswa email…"
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
          name="role"
          defaultValue={searchParams.role ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout wòl</option>
          <option value="user">Itilizatè</option>
          <option value="admin">Admin</option>
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ''}
          className="px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        >
          <option value="">Tout estati</option>
          <option value="active">Aktif</option>
          <option value="suspended">Sispann</option>
        </select>
        <button
          type="submit"
          className="px-3 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
        >
          Filtre
        </button>
        {(searchParams.q || searchParams.plan || searchParams.role || searchParams.status) && (
          <Link href="/admin/users" className="text-xs font-semibold text-earth-700 hover:text-ink">
            Reset
          </Link>
        )}
      </form>

      {/* Table */}
      <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-earth-600">
            <Users className="w-8 h-8 text-earth-500 mx-auto mb-3" strokeWidth={1.6} />
            Pa gen manm ki matche filtè a.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200 text-[10px] uppercase tracking-wider text-earth-600 font-semibold">
                <tr>
                  <th className="text-left px-5 py-3">Manm</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-left px-3 py-3">Wòl</th>
                  <th className="text-left px-3 py-3">Estati</th>
                  <th className="text-left px-3 py-3">Kondisyon</th>
                  <th className="text-left px-3 py-3">Dènye aktivite</th>
                  <th className="text-right px-5 py-3">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {rows.map((r) => {
                  const p = r.profile;
                  const name =
                    p.full_name ||
                    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
                    p.email.split('@')[0];
                  const initials = (
                    p.first_name?.[0] ??
                    p.email?.[0] ??
                    'M'
                  ).toUpperCase();
                  return (
                    <tr key={p.id} className="hover:bg-cream-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/users/${p.id}`}
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
                              {p.email}
                              {(p.city || p.country) && (
                                <>
                                  {' · '}
                                  {[p.city, p.country].filter(Boolean).join(', ')}
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                            PLAN_TONE[p.plan]
                          )}
                        >
                          {PLAN_LABEL[p.plan]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {p.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                            <Shield className="w-3 h-3" strokeWidth={2.4} />
                            {p.admin_role
                              ? ADMIN_ROLE_LABEL[p.admin_role]
                              : 'Admin'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-earth-600">Manm</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {p.suspended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            <Ban className="w-3 h-3" strokeWidth={2.4} />
                            Sispann
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                            <Sparkles className="w-3 h-3" strokeWidth={2.4} />
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {r.conditions.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="text-[10px] font-semibold bg-cream-100 text-earth-700 border border-cream-200 rounded-full px-2 py-0.5"
                            >
                              {c.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {r.conditions.length > 2 && (
                            <span className="text-[10px] font-semibold text-earth-500">
                              +{r.conditions.length - 2}
                            </span>
                          )}
                          {r.conditions.length === 0 && (
                            <span className="text-[11px] text-earth-400 italic">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-earth-600">
                        {r.lastLogAt ? (
                          <>
                            <span className="text-ink font-medium">Mezi</span>
                            <span className="text-earth-500"> · {relativeLabel(r.lastLogAt)}</span>
                          </>
                        ) : (
                          <span className="text-earth-500">Manm depi {relativeLabel(p.created_at)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/users/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800"
                        >
                          Modifye
                          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
  icon: typeof Users;
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
