import { Settings, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import SettingsForm from './settings-form';
import ReferralSection from '@/components/dashboard/referral-section';
import { buildReferralUrl, codeForUser } from '@/lib/referral';
import type {
  SubscriptionInfo,
  PastSubscription,
} from '@/components/dashboard/plan-card';
import type { PaymentRecord } from '@/components/dashboard/payment-history-panel';
import type { Database } from '@/types/database';

export const metadata = { title: 'Paramèt' };
export const dynamic = 'force-dynamic';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MedicalRow = Database['public']['Tables']['user_medical_info']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

// Default rows used as last-resort fallbacks so the form always has something
// to render. They never reach the database — the upsert path replaces them
// the moment the user toggles any control.
function defaultPreferences(userId: string): PrefRow {
  return {
    user_id: userId,
    accent: 'both',
    density: 'regular',
    font_size: 16,
    font_scale: 'medium',
    dark_mode: false,
    reduced_motion: false,
    high_contrast: false,
    sidebar_compact: false,
    card_radius: 'rounded',
    language: 'ht',
    email_notifications: true,
    push_notifications: false,
    daily_advice_email: true,
    badge_unlock_email: true,
    weekly_summary_email: false,
    reminder_time: '18:00:00',
    target_blood_sugar_min: 70,
    target_blood_sugar_max: 130,
    target_weight_kg: null,
    daily_water_liters: 2.0,
    weight_unit: 'kg',
    show_in_vip_list: true,
    share_progress_with_coach: false,
    allow_research_use: false,
    tour_completed_at: null,
    updated_at: new Date().toISOString(),
  };
}

function defaultMedical(userId: string): MedicalRow {
  return {
    user_id: userId,
    blood_type: null,
    height_cm: null,
    conditions: [],
    allergies: null,
    medications: null,
    chronic_diseases: null,
    past_surgeries: null,
    doctor_name: null,
    doctor_phone: null,
    preferred_pharmacy: null,
    health_goal: null,
    health_goal_other: null,
    notes: null,
    updated_at: new Date().toISOString(),
  };
}

function defaultProfile(userId: string, email: string): ProfileRow {
  return {
    id: userId,
    email,
    full_name: email.split('@')[0],
    first_name: null,
    last_name: null,
    avatar_url: null,
    plan: 'basic',
    role: 'user',
    suspended: false,
    date_of_birth: null,
    gender: null,
    phone: null,
    address_line1: null,
    address_line2: null,
    city: null,
    region: null,
    postal_code: null,
    country: 'HT',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: null,
    admin_role: null,
    support_persona_name: null,
    hubspot_contact_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default async function SettingsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Fan-out fetch. Each maybeSingle returns null without erroring if there's
  // no row — that lets us heal missing rows below without crashing.
  const [
    profileResult,
    preferencesResult,
    medicalResult,
    activeSubResult,
    pastSubsResult,
    paymentsResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_medical_info')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, status, start_date, end_date, amount')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, plan, status, start_date, end_date, amount')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(10),
    supabase
      .from('subscriptions')
      .select('id, plan, status, start_date, end_date, amount, payment_reference')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(50),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  // ─── Self-heal profile ───────────────────────────────────────────────────
  let profile = profileResult.data as ProfileRow | null;
  let healingNotice: string | null = null;

  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const firstName = typeof meta.first_name === 'string' ? meta.first_name.trim() : null;
    const lastName = typeof meta.last_name === 'string' ? meta.last_name.trim() : null;
    const metaFullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : null;
    const derivedFullName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      metaFullName ||
      user.email?.split('@')[0] ||
      'Manm';

    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: derivedFullName,
          first_name: firstName,
          last_name: lastName,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();
    profile = (inserted as ProfileRow | null) ?? defaultProfile(user.id, user.email ?? '');
    if (!inserted) {
      healingNotice =
        'Pwofil ou poko anrejistre konplètman. Nou ap eseye repare li — refresh paj la nan kèk segond.';
    }
  }

  // ─── Self-heal preferences ───────────────────────────────────────────────
  let preferences = preferencesResult.data as PrefRow | null;
  if (!preferences) {
    const { data: inserted } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select('*')
      .single();
    preferences = (inserted as PrefRow | null) ?? defaultPreferences(user.id);
  }

  // ─── Self-heal medical info ──────────────────────────────────────────────
  let medical = medicalResult.data as MedicalRow | null;
  if (!medical) {
    const { data: inserted } = await supabase
      .from('user_medical_info')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select('*')
      .single();
    medical = (inserted as MedicalRow | null) ?? defaultMedical(user.id);
  }

  const activeSub = activeSubResult.data as {
    id: string;
    status: 'active';
    start_date: string;
    end_date: string | null;
    amount: number | null;
  } | null;

  const subscription: SubscriptionInfo = activeSub
    ? {
        id: activeSub.id,
        status: activeSub.status,
        start_date: activeSub.start_date,
        end_date: activeSub.end_date,
        amount: activeSub.amount,
      }
    : { id: null, status: null, start_date: null, end_date: null, amount: null };

  const pastSubscriptions = (pastSubsResult.data ?? []) as PastSubscription[];
  const payments = (paymentsResult.data ?? []) as PaymentRecord[];
  const userName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email.split('@')[0];
  const shortName = userName.split(' ')[0];
  const planLabel = PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  // ─── Referral stats ────────────────────────────────────────────────────
  // Best-effort: failures shouldn't break the settings page, so we wrap
  // the pair of small reads in Promise.all + default to empty counts.
  // The cast through `unknown as ReturnType…` is because referrals and
  // subscription_credits are too new to be in the generated types yet —
  // a regenerate will drop the cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: referralsRaw }, { data: creditsRaw }] = await Promise.all([
    sb
      .from('referrals')
      .select('referee_email, signed_up_at')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    sb
      .from('subscription_credits')
      .select('id, consumed_at')
      .eq('user_id', user.id),
  ]);
  const refRows = (referralsRaw ?? []) as Array<{
    referee_email: string;
    signed_up_at: string | null;
  }>;
  const credRows = (creditsRaw ?? []) as Array<{
    id: string;
    consumed_at: string | null;
  }>;
  const referralStats = {
    link: buildReferralUrl(user.id),
    code: codeForUser(user.id),
    signedUpCount: refRows.filter((r) => r.signed_up_at).length,
    pendingCreditCount: credRows.filter((c) => !c.consumed_at).length,
    consumedCreditCount: credRows.filter((c) => c.consumed_at).length,
    recent: refRows.slice(0, 5).map((r) => ({
      email: r.referee_email,
      signed_up_at: r.signed_up_at,
    })),
  };

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[920px]">
        <header className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Settings className="w-3.5 h-3.5" strokeWidth={2.2} />
            Paramèt kont ou
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Pèsonalize <em className="text-forest-600 not-italic font-bold">eksperyans ou</em>
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-xl">
            Chak chanjman anrejistre otomatikman nan baz done a. Ou ka kite paj
            la nenpòt lè — pwogrè ou rete.
          </p>
        </header>

        {healingNotice && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm text-amber-900">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
            <span>{healingNotice}</span>
          </div>
        )}

        {/* Referral / Envite zanmi panel — placed above the long settings
            form so it stays discoverable without scrolling. */}
        <div className="mb-6">
          <ReferralSection stats={referralStats} />
        </div>

        <SettingsForm
          profile={profile}
          preferences={preferences}
          medical={medical}
          subscription={subscription}
          pastSubscriptions={pastSubscriptions}
          payments={payments}
        />
      </div>
    </>
  );
}
