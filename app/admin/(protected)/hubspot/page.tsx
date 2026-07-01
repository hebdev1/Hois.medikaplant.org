import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Link2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  XCircle,
  CircleDashed,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · HubSpot CRM' };
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

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  plan: 'basic' | 'premium' | 'vip';
  role: 'user' | 'admin';
  hubspot_contact_id: string | null;
  created_at: string;
};

type LogRow = {
  id: string;
  user_id: string | null;
  direction: 'push' | 'pull';
  hubspot_contact_id: string | null;
  status: 'ok' | 'error' | 'skipped';
  detail: string | null;
  created_at: string;
};

export default async function AdminHubspotPage() {
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
  if (!hasCapability(adminRole, 'view_hubspot')) {
    redirect('/admin');
  }

  // ── Queries (the "implementation" — works WITHOUT FDW) ────────────────
  const [
    profilesResult,
    logsResult,
    last24hLogsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, email, full_name, first_name, last_name, plan, role, hubspot_contact_id, created_at'
      )
      .eq('role', 'user')
      .order('created_at', { ascending: false }),
    supabase
      .from('hubspot_sync_log')
      .select(
        'id, user_id, direction, hubspot_contact_id, status, detail, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('hubspot_sync_log')
      .select('status', { count: 'exact', head: false })
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ),
  ]);

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const logs = (logsResult.data ?? []) as LogRow[];
  const last24h = (last24hLogsResult.data ?? []) as { status: string }[];

  // ── Query 1: sync coverage ────────────────────────────────────────────
  const totalMembers = profiles.length;
  const syncedMembers = profiles.filter((p) => p.hubspot_contact_id).length;
  const coveragePct =
    totalMembers > 0 ? Math.round((syncedMembers / totalMembers) * 100) : 0;
  const unsynced = profiles.filter((p) => !p.hubspot_contact_id);

  // ── Query 2: plan distribution (Supabase side) ────────────────────────
  const planCounts: Record<string, { total: number; synced: number }> = {
    basic: { total: 0, synced: 0 },
    premium: { total: 0, synced: 0 },
    vip: { total: 0, synced: 0 },
  };
  for (const p of profiles) {
    planCounts[p.plan] = planCounts[p.plan] ?? { total: 0, synced: 0 };
    planCounts[p.plan].total += 1;
    if (p.hubspot_contact_id) planCounts[p.plan].synced += 1;
  }

  // ── Query 3: last-24h sync activity ───────────────────────────────────
  const okCount = last24h.filter((l) => l.status === 'ok').length;
  const errCount = last24h.filter((l) => l.status === 'error').length;
  const skipCount = last24h.filter((l) => l.status === 'skipped').length;

  // ── Index for joining log rows with their member row ──────────────────
  const profileById = new Map<string, ProfileRow>();
  for (const p of profiles) profileById.set(p.id, p);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff7a59]/10 text-[#ff7a59] text-xs font-semibold mb-3">
          <Link2 className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · HubSpot CRM
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Sinkronizasyon ak HubSpot
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Apèsi sou koneksyon manm yo ak HubSpot CRM la. Rekèt yo egzekite
          sou done lokal yo (Supabase) — pa bezwen FDW pou wè estatistik sa
          yo.
        </p>
      </header>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Manm Supabase"
          value={totalMembers.toString()}
          sub="role = user"
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={Link2}
          label="Konekte ak HubSpot"
          value={syncedMembers.toString()}
          sub={`${coveragePct}% kouvèti`}
          tone="bg-forest-100 text-forest-700"
        />
        <StatCard
          icon={CircleDashed}
          label="Poko sinkronize"
          value={unsynced.length.toString()}
          sub="Pa gen contact_id"
          tone="bg-amber-100 text-amber-800"
        />
        <StatCard
          icon={AlertCircle}
          label="Erè (24è)"
          value={errCount.toString()}
          sub={`${okCount} OK · ${skipCount} sote`}
          tone={errCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}
        />
      </section>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5 md:gap-6">
        {/* ── Plan distribution + unsynced list ───────────────────────── */}
        <div className="space-y-5 md:space-y-6">
          <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <header className="mb-4">
              <h2 className="font-display text-lg font-bold text-ink">
                Distribisyon pa plan
              </h2>
              <p className="text-xs text-earth-600 mt-0.5">
                Konbyen manm chak plan, ak konbyen ki deja konekte ak HubSpot
                kòm kontak.
              </p>
            </header>
            <div className="space-y-3">
              {(['vip', 'premium', 'basic'] as const).map((plan) => {
                const c = planCounts[plan];
                const pct =
                  c.total > 0 ? Math.round((c.synced / c.total) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                          PLAN_TONE[plan]
                        )}
                      >
                        Plan {PLAN_LABEL[plan]}
                      </span>
                      <span className="text-earth-700 font-mono">
                        <strong className="text-ink">{c.synced}</strong>
                        <span className="text-earth-500"> / {c.total} sinkronize ({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-cream-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff7a59] to-[#ff5c33] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Unsynced list */}
          <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
            <header className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Manm ki poko nan HubSpot
                </h2>
                <p className="text-xs text-earth-600 mt-0.5">
                  Klike non yon manm pou ouvè fich li, epi sèvi ak bouton
                  "Sinkronize kounye a" sou kat HubSpot la.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {unsynced.length}
              </span>
            </header>

            {unsynced.length === 0 ? (
              <div className="rounded-xl bg-forest-50 border border-forest-200 p-5 text-center text-sm text-forest-800 inline-flex items-center justify-center gap-2 w-full">
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
                Tout manm yo deja konekte ak HubSpot.
              </div>
            ) : (
              <ul className="divide-y divide-cream-100 max-h-[400px] overflow-y-auto">
                {unsynced.slice(0, 50).map((p) => {
                  const name =
                    p.full_name ||
                    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
                    p.email.split('@')[0];
                  return (
                    <li key={p.id} className="py-2.5">
                      <Link
                        href={`/admin/users/${p.id}`}
                        className="flex items-center justify-between gap-3 hover:bg-cream-50/60 -mx-2 px-2 py-1.5 rounded-lg transition"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-ink truncate">
                            {name}
                          </div>
                          <div className="text-[11px] text-earth-500 truncate">
                            {p.email}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0',
                            PLAN_TONE[p.plan]
                          )}
                        >
                          {PLAN_LABEL[p.plan]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Recent sync activity ─────────────────────────────────────── */}
        <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card lg:sticky lg:top-6 lg:self-start">
          <header className="mb-4">
            <h2 className="font-display text-lg font-bold text-ink">
              Aktivite sinkronizasyon
            </h2>
            <p className="text-xs text-earth-600 mt-0.5">
              50 dènye tantativ — push (Supabase → HubSpot) ak pull (lekti).
            </p>
          </header>

          {logs.length === 0 ? (
            <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-5 text-center text-sm text-earth-600">
              Pa gen okenn sinkronizasyon ki anrejistre toujou. Klike
              &quot;Sinkronize kounye a&quot; sou fich yon manm pou kòmanse.
            </div>
          ) : (
            <ul className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((l) => {
                const member = l.user_id ? profileById.get(l.user_id) : null;
                const name = member
                  ? member.full_name ||
                    [member.first_name, member.last_name].filter(Boolean).join(' ') ||
                    member.email.split('@')[0]
                  : '—';
                return (
                  <li
                    key={l.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-2.5 items-center p-2.5 rounded-xl border border-cream-200 bg-cream-50/40"
                  >
                    <StatusIcon status={l.status} />
                    <div className="min-w-0">
                      {member ? (
                        <Link
                          href={`/admin/users/${member.id}`}
                          className="block text-sm font-semibold text-ink hover:text-[#ff7a59] truncate"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-sm text-earth-500 italic">
                          Manm efase
                        </span>
                      )}
                      <div className="text-[10px] text-earth-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="inline-flex items-center gap-0.5">
                          {l.direction === 'push' ? '→' : '←'} {l.direction}
                        </span>
                        {l.hubspot_contact_id && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-mono">
                              {l.hubspot_contact_id}
                            </span>
                          </>
                        )}
                        {l.detail && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="truncate max-w-[160px]" title={l.detail}>
                              {l.detail}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-earth-500 shrink-0 inline-flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" strokeWidth={2.4} />
                      {formatDateTime(l.created_at)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-cream-200 text-[11px] text-earth-600 leading-relaxed">
            <p className="inline-flex items-start gap-1.5">
              <RefreshCw className="w-3 h-3 mt-0.5 shrink-0 text-[#ff7a59]" strokeWidth={2.4} />
              <span>
                Klike <a href="https://app.hubspot.com" target="_blank" rel="noreferrer" className="text-[#ff7a59] hover:underline font-semibold inline-flex items-center gap-0.5">
                  HubSpot app
                  <ExternalLink className="w-2.5 h-2.5" strokeWidth={2.4} />
                </a>{' '}
                pou wè kontak yo ak yon kote pi konplè.
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex items-start gap-3">
      <span className={cn('grid place-items-center w-10 h-10 rounded-xl shrink-0', tone)}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-earth-500">
          {label}
        </div>
        <div className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight mt-0.5">
          {value}
        </div>
        <div className="text-[11px] text-earth-600 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: 'ok' | 'error' | 'skipped' }) {
  if (status === 'ok') {
    return (
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-forest-100 text-forest-700">
        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-rose-100 text-rose-700">
        <XCircle className="w-3.5 h-3.5" strokeWidth={2.4} />
      </span>
    );
  }
  return (
    <span className="grid place-items-center w-7 h-7 rounded-lg bg-cream-200 text-earth-700">
      <CircleDashed className="w-3.5 h-3.5" strokeWidth={2.4} />
    </span>
  );
}
