import { Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import SettingsForm from './settings-form';
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
type ConsultationRow = Database['public']['Tables']['consultations']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    profileResult,
    preferencesResult,
    medicalResult,
    activeSubResult,
    pastSubsResult,
    paymentsResult,
    consultationsResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
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
    supabase
      .from('consultations')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false })
      .limit(20),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = profileResult.data as ProfileRow | null;
  if (!profile) return null;

  // Auto-create preferences / medical_info rows if somehow missing
  let preferences = preferencesResult.data as PrefRow | null;
  if (!preferences) {
    const { data: inserted } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select('*')
      .single();
    preferences = inserted as PrefRow | null;
  }

  let medical = medicalResult.data as MedicalRow | null;
  if (!medical) {
    const { data: inserted } = await supabase
      .from('user_medical_info')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select('*')
      .single();
    medical = inserted as MedicalRow | null;
  }

  if (!preferences || !medical) return null;

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
  const consultations = (consultationsResult.data ?? []) as ConsultationRow[];

  const userName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email.split('@')[0];
  const shortName = userName.split(' ')[0];
  const planLabel = PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

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

        <SettingsForm
          profile={profile}
          preferences={preferences}
          medical={medical}
          subscription={subscription}
          pastSubscriptions={pastSubscriptions}
          consultations={consultations}
          payments={payments}
        />
      </div>
    </>
  );
}
