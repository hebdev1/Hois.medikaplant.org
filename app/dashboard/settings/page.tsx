import { Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import SettingsForm from './settings-form';
import type { Database } from '@/types/database';

export const metadata = { title: 'Paramèt' };
export const dynamic = 'force-dynamic';

type PrefRow = Database['public']['Tables']['user_preferences']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const DEFAULT_PREFS: Omit<PrefRow, 'user_id' | 'updated_at'> = {
  accent: 'both',
  density: 'regular',
  font_size: 16,
  dark_mode: false,
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
};

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, preferencesResult, unreadResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, plan')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = profileResult.data as {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;

  // The auto-init trigger should have created a row, but fall back to defaults
  // and insert one if missing (e.g. for an account created before this migration).
  let preferences = preferencesResult.data as PrefRow | null;
  if (!preferences) {
    const { data: inserted } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
      .select('*')
      .single();
    preferences =
      (inserted as PrefRow | null) ??
      ({
        user_id: user.id,
        updated_at: new Date().toISOString(),
        ...DEFAULT_PREFS,
      } as PrefRow);
  }

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] : 'Hoïs Bazilik';
  const unreadCount = (unreadResult.data as number | null) ?? 0;

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

        {profile && preferences && (
          <SettingsForm preferences={preferences} profile={profile} />
        )}
      </div>
    </>
  );
}
