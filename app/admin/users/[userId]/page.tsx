import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Ban,
  Sparkles,
  Activity,
  CreditCard,
  FileText,
  Bell,
  Stethoscope,
  Pill,
  Leaf,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import UserEditor from './user-editor';
import DangerZone from './danger-zone';
import DirectNotificationForm from './direct-notification-form';
import type { Database } from '@/types/database';

export const metadata = { title: 'Admin · Modifye manm' };
export const dynamic = 'force-dynamic';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Medical = Database['public']['Tables']['user_medical_info']['Row'];
type Prefs = Database['public']['Tables']['user_preferences']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type HealthLog = Database['public']['Tables']['health_logs']['Row'];
type Consultation = Database['public']['Tables']['consultations']['Row'];
type Treatment = Database['public']['Tables']['treatment_recommendations']['Row'];
type Notif = Database['public']['Tables']['notifications']['Row'];

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
  'Janvye',
  'Fevriye',
  'Mas',
  'Avril',
  'Me',
  'Jen',
  'Jiyè',
  'Out',
  'Septanm',
  'Oktòb',
  'Novanm',
  'Desanm',
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MOIS[d.getMonth()]} · ${hh}:${mm}`;
}

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

const TREATMENT_ICON: Record<string, typeof Pill> = {
  medication: Pill,
  herbal: Leaf,
  lifestyle: Activity,
  monitoring: Eye,
  referral: ArrowRight,
};
const TREATMENT_LABEL: Record<string, string> = {
  medication: 'Medikaman',
  herbal: 'Plant',
  lifestyle: 'Abitid',
  monitoring: 'Swivi',
  referral: 'Referans',
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createClient();

  // 1) Auth + admin check + fetch current admin id (for "isSelf" logic)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 2) Fetch profile first — must exist
  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .maybeSingle();

  if (profileError || !profileRaw) {
    notFound();
  }
  const profile = profileRaw as ProfileRow;

  // 3) Self-heal medical + preferences if missing
  let { data: medicalRaw } = await supabase
    .from('user_medical_info')
    .select('*')
    .eq('user_id', params.userId)
    .maybeSingle();

  if (!medicalRaw) {
    const { data: created } = await supabase
      .from('user_medical_info')
      .insert({ user_id: params.userId })
      .select('*')
      .single();
    medicalRaw = created;
  }
  const medical = medicalRaw as Medical;

  let { data: prefsRaw } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', params.userId)
    .maybeSingle();

  if (!prefsRaw) {
    const { data: created } = await supabase
      .from('user_preferences')
      .insert({ user_id: params.userId })
      .select('*')
      .single();
    prefsRaw = created;
  }
  const prefs = prefsRaw as Prefs;

  // 4) Activity sidecar fetches — best effort
  const [
    subsResult,
    activeSubResult,
    logsResult,
    consultsResult,
    treatmentsResult,
    notifsResult,
  ] = await Promise.allSettled([
    supabase
      .from('subscriptions')
      .select('id, plan, status, start_date, end_date, amount, created_at')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('subscriptions')
      .select('plan, status, start_date, end_date, amount')
      .eq('user_id', params.userId)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('health_logs')
      .select('id, logged_at, blood_sugar, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, notes')
      .eq('user_id', params.userId)
      .order('logged_at', { ascending: false })
      .limit(6),
    supabase
      .from('consultations')
      .select('id, scheduled_at, status, type, consultant_name, topic')
      .eq('user_id', params.userId)
      .order('scheduled_at', { ascending: false })
      .limit(4),
    supabase
      .from('treatment_recommendations')
      .select('id, title, kind, status, created_at, read_at')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('notifications')
      .select('id, title, message, link_url, created_at')
      .eq('target', 'user')
      .eq('target_user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const allSubs =
    subsResult.status === 'fulfilled'
      ? ((subsResult.value.data ?? []) as Pick<
          Subscription,
          'id' | 'plan' | 'status' | 'start_date' | 'end_date' | 'amount' | 'created_at'
        >[])
      : [];
  const activeSub =
    activeSubResult.status === 'fulfilled'
      ? (activeSubResult.value.data as Pick<
          Subscription,
          'plan' | 'status' | 'start_date' | 'end_date' | 'amount'
        > | null)
      : null;
  const recentLogs =
    logsResult.status === 'fulfilled'
      ? ((logsResult.value.data ?? []) as Pick<
          HealthLog,
          | 'id'
          | 'logged_at'
          | 'blood_sugar'
          | 'weight'
          | 'blood_pressure_systolic'
          | 'blood_pressure_diastolic'
          | 'heart_rate'
          | 'notes'
        >[])
      : [];
  const consults =
    consultsResult.status === 'fulfilled'
      ? ((consultsResult.value.data ?? []) as Pick<
          Consultation,
          'id' | 'scheduled_at' | 'status' | 'type' | 'consultant_name' | 'topic'
        >[])
      : [];
  const treatments =
    treatmentsResult.status === 'fulfilled'
      ? ((treatmentsResult.value.data ?? []) as Pick<
          Treatment,
          'id' | 'title' | 'kind' | 'status' | 'created_at' | 'read_at'
        >[])
      : [];
  const recentNotifs =
    notifsResult.status === 'fulfilled'
      ? ((notifsResult.value.data ?? []) as Pick<
          Notif,
          'id' | 'title' | 'message' | 'link_url' | 'created_at'
        >[])
      : [];

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email.split('@')[0];
  const initials = (
    profile.first_name?.[0] ??
    profile.email?.[0] ??
    'M'
  ).toUpperCase();
  const isSelf = currentUser?.id === profile.id;

  const stats = {
    logs: recentLogs.length,
    consults: consults.length,
    activeTreatments: treatments.filter((t) => t.status === 'active').length,
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1280px] mx-auto">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:text-forest-700 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Tounen nan lis manm yo
      </Link>

      {/* Header */}
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <span className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 font-display font-bold text-2xl shrink-0 shadow-plant">
            {initials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
                {fullName}
              </h1>
              {isSelf && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  Ou menm
                </span>
              )}
            </div>
            <div className="mt-1.5 text-sm text-earth-600 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" strokeWidth={2} />
                {profile.email}
              </span>
              {profile.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                  {profile.phone}
                </span>
              )}
              {(profile.city || profile.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                Manm depi {formatDate(profile.created_at)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full',
                  PLAN_TONE[profile.plan]
                )}
              >
                Plan {PLAN_LABEL[profile.plan]}
              </span>
              {profile.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-accent/10 text-accent">
                  <Shield className="w-3 h-3" strokeWidth={2.4} />
                  Admin
                </span>
              )}
              {profile.suspended ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                  <Ban className="w-3 h-3" strokeWidth={2.4} />
                  Sispann
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-forest-100 text-forest-700">
                  <Sparkles className="w-3 h-3" strokeWidth={2.4} />
                  Aktif
                </span>
              )}
              <Link
                href={`/admin/health/${profile.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-800 px-2 py-1 rounded-full bg-forest-50 border border-forest-100 hover:bg-forest-100 transition"
              >
                <Stethoscope className="w-3 h-3" strokeWidth={2.4} />
                Wè vi klinik
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickStat
            icon={Activity}
            label="Mezi resan"
            value={`${stats.logs}`}
            tone="bg-forest-100 text-forest-700"
          />
          <QuickStat
            icon={Stethoscope}
            label="Konsiltasyon"
            value={`${stats.consults}`}
            tone="bg-teal-100 text-teal-700"
          />
          <QuickStat
            icon={Pill}
            label="Tretman aktif"
            value={`${stats.activeTreatments}`}
            tone="bg-indigo-100 text-indigo-700"
          />
          <QuickStat
            icon={CreditCard}
            label="Plan aktyèl"
            value={PLAN_LABEL[profile.plan] ?? '—'}
            tone="bg-amber-100 text-amber-700"
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* ── LEFT: full editor ─────────────────────────────────────────────── */}
        <div className="space-y-5 md:space-y-6 min-w-0">
          <DangerZone
            userId={profile.id}
            initialPlan={profile.plan as 'basic' | 'premium' | 'vip'}
            initialRole={profile.role as 'user' | 'admin'}
            initialSuspended={profile.suspended ?? false}
            email={profile.email}
            isSelf={isSelf}
          />

          <UserEditor
            userId={profile.id}
            profile={profile}
            medical={medical}
            preferences={prefs}
          />
        </div>

        {/* ── RIGHT: activity sidebar ───────────────────────────────────────── */}
        <aside className="space-y-5 md:space-y-6 lg:sticky lg:top-6 lg:self-start min-w-0">
          <DirectNotificationForm userId={profile.id} email={profile.email} />

          {/* Active subscription */}
          <SidePanel
            icon={CreditCard}
            title="Abònman aktyèl"
            iconTone="bg-amber-100 text-amber-700"
          >
            {activeSub ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-ink">
                    Plan {PLAN_LABEL[activeSub.plan] ?? activeSub.plan}
                  </span>
                  <span className="text-xs text-earth-500">
                    {activeSub.status}
                  </span>
                </div>
                {activeSub.amount != null && (
                  <div className="text-sm text-earth-700">
                    ${activeSub.amount.toFixed(0)} USD
                  </div>
                )}
                <div className="text-[11px] text-earth-500">
                  {formatDate(activeSub.start_date)}
                  {activeSub.end_date && ` → ${formatDate(activeSub.end_date)}`}
                </div>
              </div>
            ) : (
              <EmptyText>Pa gen abònman aktif.</EmptyText>
            )}
          </SidePanel>

          {/* Subscription history */}
          {allSubs.length > 0 && (
            <SidePanel
              icon={FileText}
              title="Istwa abònman"
              iconTone="bg-slate-100 text-slate-700"
            >
              <ul className="space-y-2">
                {allSubs.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">
                        {PLAN_LABEL[s.plan] ?? s.plan}
                        <span className="ml-1.5 text-[10px] font-medium text-earth-500 uppercase tracking-wide">
                          {s.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-earth-500">
                        {formatDate(s.start_date)}
                        {s.end_date && ` → ${formatDate(s.end_date)}`}
                      </div>
                    </div>
                    {s.amount != null && (
                      <span className="text-earth-700 font-medium shrink-0">
                        ${s.amount.toFixed(0)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </SidePanel>
          )}

          {/* Recent health logs */}
          <SidePanel
            icon={Activity}
            title="Mezi sante resan"
            iconTone="bg-forest-100 text-forest-700"
            cta={
              <Link
                href={`/admin/health/${profile.id}`}
                className="text-[11px] font-semibold text-forest-700 hover:text-forest-800"
              >
                Tout →
              </Link>
            }
          >
            {recentLogs.length === 0 ? (
              <EmptyText>Pasyan an pa janm anrejistre mezi.</EmptyText>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-earth-700 truncate">
                        {[
                          l.blood_sugar != null && `Sik ${l.blood_sugar}`,
                          l.weight != null && `${l.weight} kg`,
                          l.blood_pressure_systolic != null &&
                            `${l.blood_pressure_systolic}/${l.blood_pressure_diastolic ?? '—'}`,
                          l.heart_rate != null && `${l.heart_rate} bpm`,
                        ]
                          .filter(Boolean)
                          .join(' · ') || (l.notes ? l.notes.slice(0, 40) : '—')}
                      </div>
                    </div>
                    <span className="text-[10px] text-earth-500 shrink-0">
                      {formatDateTime(l.logged_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SidePanel>

          {/* Consultations */}
          {consults.length > 0 && (
            <SidePanel
              icon={Stethoscope}
              title="Konsiltasyon"
              iconTone="bg-teal-100 text-teal-700"
            >
              <ul className="space-y-2">
                {consults.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate">
                        {c.consultant_name}
                      </div>
                      <div className="text-[10px] text-earth-500 truncate">
                        {c.topic ?? c.type}
                      </div>
                    </div>
                    <span className="text-[10px] text-earth-500 shrink-0">
                      {formatDateTime(c.scheduled_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </SidePanel>
          )}

          {/* Treatments recap */}
          {treatments.length > 0 && (
            <SidePanel
              icon={Pill}
              title="Tretman pwopoze"
              iconTone="bg-indigo-100 text-indigo-700"
              cta={
                <Link
                  href={`/admin/health/${profile.id}`}
                  className="text-[11px] font-semibold text-forest-700 hover:text-forest-800"
                >
                  Jere →
                </Link>
              }
            >
              <ul className="space-y-2">
                {treatments.map((t) => {
                  const Icon = TREATMENT_ICON[t.kind] ?? Pill;
                  return (
                    <li
                      key={t.id}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="grid place-items-center w-7 h-7 rounded-lg bg-cream-100 text-earth-700 shrink-0">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink truncate">
                          {t.title}
                        </div>
                        <div className="text-[10px] text-earth-500">
                          {TREATMENT_LABEL[t.kind] ?? t.kind} · {t.status}
                          {' · '}
                          {relativeLabel(t.created_at)}
                          {t.read_at && ' · li'}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SidePanel>
          )}

          {/* Recent direct notifications */}
          {recentNotifs.length > 0 && (
            <SidePanel
              icon={Bell}
              title="Dènye notifikasyon"
              iconTone="bg-accent/10 text-accent"
            >
              <ul className="space-y-2.5">
                {recentNotifs.map((n) => (
                  <li key={n.id}>
                    <div className="text-xs font-semibold text-ink line-clamp-1">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-earth-600 line-clamp-2 mt-0.5">
                      {n.message}
                    </div>
                    <div className="text-[10px] text-earth-500 mt-0.5">
                      {formatDateTime(n.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            </SidePanel>
          )}
        </aside>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-cream-50 border border-cream-200 p-3 flex items-center gap-3">
      <span className={cn('grid place-items-center w-9 h-9 rounded-lg', tone)}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">
          {label}
        </div>
        <div className="text-sm font-semibold text-ink">{value}</div>
      </div>
    </div>
  );
}

function SidePanel({
  icon: Icon,
  title,
  iconTone,
  cta,
  children,
}: {
  icon: typeof Activity;
  title: string;
  iconTone: string;
  cta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card">
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('grid place-items-center w-8 h-8 rounded-lg', iconTone)}>
            <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
          </span>
          <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        </div>
        {cta}
      </header>
      {children}
    </section>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-cream-50 border border-dashed border-cream-200 p-3 text-center text-xs text-earth-500 italic">
      {children}
    </div>
  );
}
