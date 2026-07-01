import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Bell,
  Megaphone,
  Users,
  CreditCard,
  Mail,
  ExternalLink,
  CalendarDays,
  Inbox,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import BroadcastComposer from './broadcast-composer';
import DeleteNotificationButton from './delete-notification-button';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

export const metadata = { title: 'Admin · Notifikasyon' };
export const dynamic = 'force-dynamic';

type NotifRow = Database['public']['Tables']['notifications']['Row'];
type Profile = {
  id: string;
  full_name: string | null;
  email: string;
};

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} · ${hh}:${mm}`;
}

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'kounye a';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} è`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} jou`;
  if (days < 30) return `${Math.floor(days / 7)} sem`;
  if (days < 365) return `${Math.floor(days / 30)} mwa`;
  return `${Math.floor(days / 365)} ane`;
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: { target?: string };
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
  if (!hasCapability(adminRole, 'broadcast_notifications')) {
    redirect('/admin');
  }

  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const all = (rawNotifs ?? []) as NotifRow[];

  // Stats
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const stats = {
    total: all.length,
    broadcast: all.filter((n) => n.target === 'all').length,
    planTargeted: all.filter((n) => n.target === 'plan').length,
    userTargeted: all.filter((n) => n.target === 'user').length,
    last7Days: all.filter(
      (n) => new Date(n.created_at).getTime() > sevenDaysAgo
    ).length,
  };

  // Resolve referenced user/creator profiles for the history
  const userIds = new Set<string>();
  for (const n of all) {
    if (n.target_user_id) userIds.add(n.target_user_id);
    if (n.created_by) userIds.add(n.created_by);
  }

  const profilesById = new Map<string, Profile>();
  if (userIds.size > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));
    for (const p of (profilesData ?? []) as Profile[]) {
      profilesById.set(p.id, p);
    }
  }

  // Apply filter
  const targetFilter = searchParams.target;
  let visible = all;
  if (targetFilter && ['all', 'plan', 'user'].includes(targetFilter)) {
    visible = all.filter((n) => n.target === targetFilter);
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Bell className="w-3.5 h-3.5" strokeWidth={2.2} />
          Admin · Notifikasyon
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Notifikasyon ak <em className="text-forest-600 not-italic font-bold">anonse</em>
        </h1>
        <p className="mt-2 text-sm text-earth-600 max-w-2xl">
          Voye mesaj an direk sou kloch manm yo. Sib tout kominote a, yon
          plan abònman espesifik, oswa yon sèl manm pa imel. Notifikasyon
          otomatik (gid pibliye, repons sipò, tretman pwopoze) parèt isit
          tou.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={Bell}
          label="Total"
          value={stats.total}
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={Megaphone}
          label="Sou tout manm"
          value={stats.broadcast}
          tone="bg-accent/10 text-accent"
        />
        <StatCard
          icon={CreditCard}
          label="Pa plan"
          value={stats.planTargeted}
          tone="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={Mail}
          label="Pa manm"
          value={stats.userTargeted}
          tone="bg-forest-100 text-forest-700"
        />
        <StatCard
          icon={CalendarDays}
          label="Dènye 7 jou"
          value={stats.last7Days}
          tone="bg-teal-100 text-teal-700"
        />
      </section>

      {/* Two-column: composer + history */}
      <div className="grid lg:grid-cols-[420px_1fr] gap-5 md:gap-6 items-start">
        {/* Left: Composer (sticky on desktop) */}
        <div className="lg:sticky lg:top-6">
          <BroadcastComposer />
        </div>

        {/* Right: History */}
        <section className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
          <header className="px-5 py-4 border-b border-cream-200 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-cream-50 to-white">
            <div>
              <h2 className="font-display text-base font-bold text-ink leading-tight">
                Istwa
              </h2>
              <p className="text-[11px] text-earth-600 mt-0.5">
                Dènye 200 notifikasyon ki te voye.
              </p>
            </div>
            <nav className="flex items-center gap-1 text-[11px] font-semibold">
              <FilterPill href="/admin/notifications" label="Tout" active={!targetFilter} count={stats.total} />
              <FilterPill href="/admin/notifications?target=all" label="Sou tout" active={targetFilter === 'all'} count={stats.broadcast} />
              <FilterPill href="/admin/notifications?target=plan" label="Pa plan" active={targetFilter === 'plan'} count={stats.planTargeted} />
              <FilterPill href="/admin/notifications?target=user" label="Pa manm" active={targetFilter === 'user'} count={stats.userTargeted} />
            </nav>
          </header>

          {visible.length === 0 ? (
            <div className="p-12 text-center">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-cream-100 text-earth-500 mx-auto mb-3">
                <Inbox className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div className="font-display text-base font-bold text-ink">
                Pa gen notifikasyon
              </div>
              <p className="text-xs text-earth-600 mt-1.5 max-w-xs mx-auto">
                {targetFilter
                  ? 'Pa gen notifikasyon ki matche filtè a.'
                  : 'Voye yon mesaj nan fòm la pou kòmanse.'}
              </p>
              {targetFilter && (
                <Link
                  href="/admin/notifications"
                  className="inline-block mt-3 text-xs font-semibold text-forest-700 hover:text-forest-800"
                >
                  Reset filtè →
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {visible.map((n) => {
                const targetProfile = n.target_user_id
                  ? profilesById.get(n.target_user_id)
                  : null;
                const creator = n.created_by
                  ? profilesById.get(n.created_by)
                  : null;
                return (
                  <li key={n.id} className="px-5 py-4 hover:bg-cream-50/40 transition">
                    <div className="flex items-start gap-3">
                      <TargetBadge
                        target={n.target}
                        targetPlan={n.target_plan}
                        targetProfile={targetProfile}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink text-sm leading-tight">
                          {n.title}
                        </div>
                        <div className="text-xs text-earth-700 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                          {n.message}
                        </div>
                        <div className="mt-2 flex items-center gap-2.5 flex-wrap text-[10px] text-earth-500">
                          <span title={formatDateTime(n.created_at)}>
                            {relativeLabel(n.created_at)} pase
                          </span>
                          {creator && (
                            <>
                              <span aria-hidden>·</span>
                              <span>
                                pa{' '}
                                <span className="font-semibold text-earth-700">
                                  {creator.full_name || creator.email.split('@')[0]}
                                </span>
                              </span>
                            </>
                          )}
                          {n.link_url && (
                            <>
                              <span aria-hidden>·</span>
                              <Link
                                href={n.link_url}
                                className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-800 hover:underline truncate max-w-[160px]"
                                target={
                                  n.link_url.startsWith('http')
                                    ? '_blank'
                                    : undefined
                                }
                                rel={
                                  n.link_url.startsWith('http')
                                    ? 'noreferrer'
                                    : undefined
                                }
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                                <span className="truncate">{n.link_url}</span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                      <DeleteNotificationButton id={n.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
  count,
}: {
  href: string;
  label: string;
  active: boolean;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition',
        active
          ? 'bg-forest-700 text-cream-50 shadow-sm'
          : 'text-earth-700 hover:bg-cream-100'
      )}
    >
      {label}
      <span
        className={cn(
          'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
          active ? 'bg-white/20 text-cream-50' : 'bg-cream-100 text-earth-600'
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bell;
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

function TargetBadge({
  target,
  targetPlan,
  targetProfile,
}: {
  target: 'all' | 'plan' | 'user';
  targetPlan: 'basic' | 'premium' | 'vip' | null;
  targetProfile: Profile | null | undefined;
}) {
  if (target === 'all') {
    return (
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent/10 text-accent shrink-0">
        <Megaphone className="w-4 h-4" strokeWidth={2.2} />
      </span>
    );
  }
  if (target === 'plan') {
    return (
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber-100 text-amber-700">
          <CreditCard className="w-4 h-4" strokeWidth={2.2} />
        </span>
        {targetPlan && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700">
            {PLAN_LABEL[targetPlan]}
          </span>
        )}
      </div>
    );
  }
  // user
  const initials = (
    targetProfile?.full_name?.[0] ??
    targetProfile?.email?.[0] ??
    'M'
  ).toUpperCase();
  return (
    <div
      className="flex flex-col items-center gap-0.5 shrink-0"
      title={targetProfile?.email ?? ''}
    >
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 font-display font-bold text-sm">
        {initials}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-forest-700 max-w-[60px] truncate">
        {targetProfile?.full_name?.split(' ')[0] ??
          targetProfile?.email?.split('@')[0] ??
          'Manm'}
      </span>
    </div>
  );
}
