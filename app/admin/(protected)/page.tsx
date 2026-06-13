import Link from 'next/link';
import {
  Users,
  CreditCard,
  Activity,
  Layers,
  Inbox,
  MessageCircle,
  MessagesSquare,
  BookOpen,
  FileText,
  Sparkles,
  Award,
  Bell,
  CalendarRange,
  Link2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { describeCondition } from '@/lib/conditions/catalog';

export const metadata = { title: 'Admin · Overview' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

const MONTHS_HT = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]}`;
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${formatDate(iso)} · ${hh}h${mm}`;
}

export default async function AdminOverview() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const last7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const last30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // ── All-in-one Promise.all to keep the overview render under 1 RTT ─────
  const [
    // KPI strip
    profilesTotal,
    profilesNew7d,
    activeSubs,
    activeEnrollments,
    // Plan distribution
    planBasic,
    planPremium,
    planVip,
    // Inboxes / queues (action-needed)
    contactNew,
    contactRecent,
    supportOpen,
    supportRecent,
    // Segments
    medicalAll,
    // Programs
    programsActive,
    programTasksCount,
    // Health
    healthLogs7d,
    healthLatest,
    // Content
    guidesCount,
    resourcesCount,
    badgesCount,
    badgesUnlockedTotal,
    // Daily advice
    adviceToday,
    adviceUpcoming,
    // Forum
    forumTopicsRecent,
    // Notifications
    notifsRecent,
    // HubSpot
    hubspotSynced,
    hubspotLogRecent,
    // Subscriptions trend
    subsLast30d,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', last7d),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('user_programs').select('id', { count: 'exact', head: true }).eq('is_active', true),

    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user').eq('plan', 'basic'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user').eq('plan', 'premium'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user').eq('plan', 'vip'),

    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('contact_messages').select('id, full_name, subject, created_at, status').order('created_at', { ascending: false }).limit(4),
    supabase.from('support_threads').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_threads').select('id, subject, status, last_message_at, agent_name, profiles!support_threads_user_id_fkey(full_name)').order('last_message_at', { ascending: false }).limit(4),

    supabase.from('user_medical_info').select('user_id, conditions, profiles!inner(role)').neq('conditions', '{}'),

    supabase.from('programs').select('id, name, slug, plan_required, total_days', { count: 'exact' }).eq('active', true),
    supabase.from('program_tasks').select('id', { count: 'exact', head: true }),

    supabase.from('health_logs').select('id', { count: 'exact', head: true }).gte('logged_at', last7d),
    supabase.from('health_logs').select('logged_at, blood_sugar, blood_pressure_systolic, weight, user_id, profiles(full_name)').order('logged_at', { ascending: false }).limit(4),

    supabase.from('guides').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('badges').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('user_badges').select('badge_id', { count: 'exact', head: true }).eq('unlocked', true),

    supabase.from('daily_advice').select('id, body_html, plant_name').eq('publish_date', today).maybeSingle(),
    supabase.from('daily_advice').select('id, publish_date, plant_name', { count: 'exact' }).gt('publish_date', today),

    supabase.from('forum_topics').select('id, title, slug, last_reply_at, reply_count, view_count').order('last_reply_at', { ascending: false }).limit(4),

    supabase.from('notifications').select('id, title, target, target_plan, created_at').order('created_at', { ascending: false }).limit(3),

    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('hubspot_contact_id', 'is', null).eq('role', 'user'),
    supabase.from('hubspot_sync_log').select('status, created_at, detail').order('created_at', { ascending: false }).limit(1),

    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).gte('start_date', last30d),
  ]);

  // ── Segments aggregation in JS ────────────────────────────────────────
  type MedicalRow = {
    user_id: string;
    conditions: string[] | null;
    profiles:
      | { role: string }
      | { role: string }[]
      | null;
  };
  const medicalRows = (medicalAll.data ?? []) as unknown as MedicalRow[];
  const segmentCounts = new Map<string, number>();
  for (const r of medicalRows) {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    if (!p || p.role !== 'user') continue;
    for (const cond of r.conditions ?? []) {
      segmentCounts.set(cond, (segmentCounts.get(cond) ?? 0) + 1);
    }
  }
  const topSegments = Array.from(segmentCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([slug, count]) => ({ ...describeCondition(slug), count }));

  // ── Quick references for cards ────────────────────────────────────────
  const totalUsers = profilesTotal.count ?? 0;
  const newUsers7d = profilesNew7d.count ?? 0;
  const subs7dPct = totalUsers > 0 ? Math.round((newUsers7d / totalUsers) * 100) : 0;

  const lastSyncLog = ((hubspotLogRecent.data ?? []) as Array<{
    status: string;
    created_at: string;
    detail: string | null;
  }>)[0];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto">
      <header className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin Overview
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Sa kap pase sou MedikaPlant
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Rezime tout seksyon admin yo nan yon sèl ekran. Klike yon kat
          pou ale dirèkteman sou paj seksyon an.
        </p>
      </header>

      {/* ── KPI strip — 4 critical numbers ───────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-7">
        <KpiCard
          icon={<Users className="w-4 h-4" strokeWidth={2.4} />}
          label="Manm total"
          value={totalUsers.toString()}
          sub={`+${newUsers7d} 7 jou (${subs7dPct}%)`}
          tone="forest"
          href="/admin/users"
        />
        <KpiCard
          icon={<CreditCard className="w-4 h-4" strokeWidth={2.4} />}
          label="Abònman aktif"
          value={(activeSubs.count ?? 0).toString()}
          sub={`+${subsLast30d.count ?? 0} 30 jou`}
          tone="gold"
          href="/admin/subscriptions"
        />
        <KpiCard
          icon={<Layers className="w-4 h-4" strokeWidth={2.4} />}
          label="Segman aktif"
          value={segmentCounts.size.toString()}
          sub={`${medicalRows.length} manm ak yon kondisyon`}
          tone="rose"
          href="/admin/segments"
        />
        <KpiCard
          icon={<CalendarRange className="w-4 h-4" strokeWidth={2.4} />}
          label="Plan + Tach"
          value={(programsActive.count ?? 0).toString()}
          sub={`${programTasksCount.count ?? 0} tach pwograme`}
          tone="violet"
          href="/admin/programs"
        />
      </section>

      {/* ── Plan distribution mini-chart ─────────────────────────────── */}
      <section className="bg-white border border-cream-200 rounded-2xl p-5 shadow-card mb-7">
        <header className="mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold">
            Distribisyon plan
          </div>
        </header>
        <div className="space-y-2.5">
          <PlanBar
            label={PLAN_LABEL.basic}
            count={planBasic.count ?? 0}
            total={totalUsers}
            tone="bg-slate-300"
          />
          <PlanBar
            label={PLAN_LABEL.premium}
            count={planPremium.count ?? 0}
            total={totalUsers}
            tone="bg-teal-400"
          />
          <PlanBar
            label={PLAN_LABEL.vip}
            count={planVip.count ?? 0}
            total={totalUsers}
            tone="bg-amber-400"
          />
        </div>
      </section>

      {/* ── Action queues row (contact + support) ─────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-4 md:gap-5 mb-7">
        <SectionCard
          icon={<Inbox className="w-4 h-4" strokeWidth={2.4} />}
          title="Mesaj kontak"
          href="/admin/contact"
          badge={
            (contactNew.count ?? 0) > 0
              ? `${contactNew.count} nouvo`
              : 'Pa gen nouvo'
          }
          badgeTone={(contactNew.count ?? 0) > 0 ? 'rose' : 'forest'}
        >
          {((contactRecent.data ?? []) as Array<{
            id: string;
            full_name: string;
            subject: string;
            created_at: string;
            status: string;
          }>).length === 0 ? (
            <Empty text="Pa gen mesaj." />
          ) : (
            <ul className="space-y-2">
              {((contactRecent.data ?? []) as Array<{
                id: string;
                full_name: string;
                subject: string;
                created_at: string;
                status: string;
              }>).map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink truncate">
                      {m.full_name}{' '}
                      {m.status === 'new' && (
                        <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-rose-500 align-middle" />
                      )}
                    </div>
                    <div className="text-earth-600 truncate">{m.subject}</div>
                  </div>
                  <span className="text-[10px] text-earth-500 font-mono shrink-0">
                    {formatDate(m.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          icon={<MessageCircle className="w-4 h-4" strokeWidth={2.4} />}
          title="Sipò chat"
          href="/admin/support"
          badge={
            (supportOpen.count ?? 0) > 0
              ? `${supportOpen.count} ouvè`
              : 'Tout trete'
          }
          badgeTone={(supportOpen.count ?? 0) > 0 ? 'violet' : 'forest'}
        >
          {((supportRecent.data ?? []) as Array<{
            id: string;
            subject: string;
            status: string;
            last_message_at: string;
            agent_name: string | null;
            profiles: { full_name: string | null } | { full_name: string | null }[] | null;
          }>).length === 0 ? (
            <Empty text="Pa gen konvèsasyon." />
          ) : (
            <ul className="space-y-2">
              {((supportRecent.data ?? []) as Array<{
                id: string;
                subject: string;
                status: string;
                last_message_at: string;
                agent_name: string | null;
                profiles: { full_name: string | null } | { full_name: string | null }[] | null;
              }>).map((s) => {
                const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
                return (
                  <li key={s.id} className="flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate">
                        {p?.full_name ?? 'Manm'}
                        {s.status === 'open' && (
                          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-violet-500 align-middle" />
                        )}
                      </div>
                      <div className="text-earth-600 truncate">{s.subject}</div>
                    </div>
                    <span className="text-[10px] text-earth-500 font-mono shrink-0">
                      {formatDate(s.last_message_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </section>

      {/* ── Segments + Health row ─────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-4 md:gap-5 mb-7">
        <SectionCard
          icon={<Layers className="w-4 h-4" strokeWidth={2.4} />}
          title="Top segman maladi"
          href="/admin/segments"
          badge={`${segmentCounts.size} segman`}
          badgeTone="cream"
        >
          {topSegments.length === 0 ? (
            <Empty text="Pa gen manm ak yon kondisyon ankò." />
          ) : (
            <ul className="space-y-2">
              {topSegments.map((s) => (
                <li
                  key={s.slug}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0" aria-hidden>
                      {s.icon}
                    </span>
                    <span className="font-semibold text-ink truncate">
                      {s.label}
                    </span>
                  </div>
                  <span className="font-mono text-earth-700 shrink-0">
                    {s.count} manm
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          icon={<Activity className="w-4 h-4" strokeWidth={2.4} />}
          title="Swivi sante"
          href="/admin/health"
          badge={`${healthLogs7d.count ?? 0} mezi 7 jou`}
          badgeTone="forest"
        >
          {((healthLatest.data ?? []) as Array<{
            logged_at: string;
            blood_sugar: number | null;
            blood_pressure_systolic: number | null;
            weight: number | null;
            user_id: string;
            profiles: { full_name: string | null } | { full_name: string | null }[] | null;
          }>).length === 0 ? (
            <Empty text="Pa gen mezi resan." />
          ) : (
            <ul className="space-y-2">
              {((healthLatest.data ?? []) as Array<{
                logged_at: string;
                blood_sugar: number | null;
                blood_pressure_systolic: number | null;
                weight: number | null;
                user_id: string;
                profiles: { full_name: string | null } | { full_name: string | null }[] | null;
              }>).map((h, i) => {
                const p = Array.isArray(h.profiles) ? h.profiles[0] : h.profiles;
                const measure = h.blood_sugar
                  ? `${h.blood_sugar} mg/dL sik`
                  : h.blood_pressure_systolic
                  ? `${h.blood_pressure_systolic} sys`
                  : h.weight
                  ? `${h.weight} kg`
                  : 'mezi';
                return (
                  <li
                    key={`${h.user_id}-${i}`}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-ink truncate min-w-0">
                      {p?.full_name ?? 'Manm'}
                    </span>
                    <span className="text-earth-600 font-mono shrink-0">
                      {measure}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </section>

      {/* ── Content row ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-7">
        <MiniStat
          icon={<BookOpen className="w-4 h-4" strokeWidth={2.4} />}
          label="Gid"
          value={(guidesCount.count ?? 0).toString()}
          href="/admin/guides"
        />
        <MiniStat
          icon={<FileText className="w-4 h-4" strokeWidth={2.4} />}
          label="Resous"
          value={(resourcesCount.count ?? 0).toString()}
          href="/admin/resources"
        />
        <MiniStat
          icon={<Sparkles className="w-4 h-4" strokeWidth={2.4} />}
          label="Konsèy jou a"
          value={adviceToday.data ? '✓' : '—'}
          sub={
            adviceUpcoming.count
              ? `+${adviceUpcoming.count} pwograme`
              : 'pa gen pwograme'
          }
          href="/admin/advice"
        />
        <MiniStat
          icon={<Award className="w-4 h-4" strokeWidth={2.4} />}
          label="Badj"
          value={`${badgesCount.count ?? 0}`}
          sub={`${badgesUnlockedTotal.count ?? 0} debloke`}
          href="/admin/badges"
        />
      </section>

      {/* ── Forum + Notifications + HubSpot row ──────────────────────── */}
      <section className="grid lg:grid-cols-3 gap-4 md:gap-5">
        <SectionCard
          icon={<MessagesSquare className="w-4 h-4" strokeWidth={2.4} />}
          title="Fowòm"
          href="/admin/forum"
          badge={`${((forumTopicsRecent.data ?? []) as Array<unknown>).length} resan`}
          badgeTone="cream"
        >
          {((forumTopicsRecent.data ?? []) as Array<{
            id: string;
            title: string;
            slug: string;
            last_reply_at: string | null;
            reply_count: number;
            view_count: number;
          }>).length === 0 ? (
            <Empty text="Pa gen topik resan." />
          ) : (
            <ul className="space-y-2">
              {((forumTopicsRecent.data ?? []) as Array<{
                id: string;
                title: string;
                slug: string;
                last_reply_at: string | null;
                reply_count: number;
                view_count: number;
              }>).map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink truncate">{t.title}</div>
                    <div className="text-[10px] text-earth-500 mt-0.5">
                      {t.reply_count} repons · {t.view_count} vi
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          icon={<Bell className="w-4 h-4" strokeWidth={2.4} />}
          title="Notifikasyon resan"
          href="/admin/notifications"
          badge={`${((notifsRecent.data ?? []) as Array<unknown>).length} dènye`}
          badgeTone="cream"
        >
          {((notifsRecent.data ?? []) as Array<{
            id: string;
            title: string;
            target: string;
            target_plan: string | null;
            created_at: string;
          }>).length === 0 ? (
            <Empty text="Pa gen notifikasyon." />
          ) : (
            <ul className="space-y-2">
              {((notifsRecent.data ?? []) as Array<{
                id: string;
                title: string;
                target: string;
                target_plan: string | null;
                created_at: string;
              }>).map((n) => (
                <li key={n.id} className="text-xs">
                  <div className="font-semibold text-ink truncate">{n.title}</div>
                  <div className="text-[10px] text-earth-500 mt-0.5">
                    {n.target === 'all'
                      ? 'Tout manm'
                      : n.target === 'plan'
                      ? `Plan ${n.target_plan}`
                      : 'Pèsonèl'}
                    {' · '}
                    {formatDate(n.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          icon={<Link2 className="w-4 h-4" strokeWidth={2.4} />}
          title="HubSpot CRM"
          href="/admin/hubspot"
          badge={`${hubspotSynced.count ?? 0} sync`}
          badgeTone={lastSyncLog?.status === 'error' ? 'rose' : 'forest'}
        >
          <div className="text-xs space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">
                Manm sinkronize
              </div>
              <div className="font-mono text-ink font-semibold">
                {hubspotSynced.count ?? 0} / {totalUsers}
              </div>
            </div>
            {lastSyncLog && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">
                  Dènye sync
                </div>
                <div className="text-earth-700">
                  {lastSyncLog.status === 'ok'
                    ? '✓ OK'
                    : lastSyncLog.status === 'error'
                    ? '⚠ Erè'
                    : '○ Sote'}
                  <span className="ml-1 text-[10px] text-earth-500">
                    {formatDateTime(lastSyncLog.created_at)}
                  </span>
                </div>
                {lastSyncLog.detail && (
                  <div className="text-[10px] text-earth-500 mt-0.5 truncate">
                    {lastSyncLog.detail}
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// UI primitives
// ───────────────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: 'forest' | 'gold' | 'rose' | 'violet';
  href: string;
}) {
  const toneStyles: Record<typeof tone, string> = {
    forest: 'bg-forest-50 border-forest-200 text-forest-800',
    gold: 'bg-gold-50 border-gold-200 text-gold-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
  } as const;
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 md:p-5 transition hover:scale-[1.02] ${toneStyles[tone]}`}
    >
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold opacity-80 mb-2">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl md:text-3xl font-bold tracking-tight">
        {value}
      </div>
      {sub && <div className="text-[11px] opacity-75 mt-1">{sub}</div>}
    </Link>
  );
}

function PlanBar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-earth-600 font-mono">
          {count} <span className="text-earth-400">·</span> {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-cream-100 overflow-hidden">
        <div
          className={`h-full ${tone} transition-[width] duration-500`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  href,
  badge,
  badgeTone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  badge: string;
  badgeTone: 'rose' | 'forest' | 'violet' | 'cream';
  children: React.ReactNode;
}) {
  const badgeStyles: Record<typeof badgeTone, string> = {
    rose: 'bg-rose-100 text-rose-700',
    forest: 'bg-forest-100 text-forest-700',
    violet: 'bg-violet-100 text-violet-700',
    cream: 'bg-cream-200 text-earth-700',
  } as const;
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 min-w-0">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-cream-50 border border-cream-200 text-earth-700 shrink-0">
            {icon}
          </span>
          <h3 className="font-display text-base font-bold text-ink truncate">
            {title}
          </h3>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${badgeStyles[badgeTone]}`}
        >
          {badge}
        </span>
      </header>
      <div className="min-h-[80px]">{children}</div>
      <footer className="pt-1 border-t border-cream-100">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900 transition"
        >
          Wè tout
          <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
        </Link>
      </footer>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card hover:shadow-plant hover:border-forest-300 transition flex flex-col gap-1"
    >
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-earth-600 font-bold">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
      {sub && <div className="text-[10px] text-earth-500">{sub}</div>}
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-earth-500 italic py-2 text-center">
      {text}
    </div>
  );
}
