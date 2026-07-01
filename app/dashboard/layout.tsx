import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/sidebar';
import UserAppearance from '@/components/dashboard/user-appearance';
import type { Database } from '@/types/database';

type PrefsRow = Database['public']['Tables']['user_preferences']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

type SidebarProfile = {
  role: 'user' | 'admin';
  suspended: boolean;
  full_name: string | null;
  plan: 'basic' | 'premium' | 'vip';
  email: string;
  avatar_url: string | null;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/dashboard');

  // Some users (especially early-adopters who signed up before
  // handle_new_user existed) may not have a profile row. Auto-heal by
  // upserting a default row before the page renders — the downstream
  // triggers on profiles will populate user_preferences and
  // user_medical_info automatically.
  let profile: SidebarProfile | null = null;

  const [profileResult, prefsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, suspended, full_name, plan, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_preferences')
      .select(
        'accent, density, dark_mode, font_size, font_scale, reduced_motion, high_contrast, card_radius, language'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const { data: existing, error: fetchError } = profileResult;
  const prefs = (prefsResult.data ?? null) as Pick<
    PrefsRow,
    | 'accent'
    | 'density'
    | 'dark_mode'
    | 'font_size'
    | 'font_scale'
    | 'reduced_motion'
    | 'high_contrast'
    | 'card_radius'
    | 'language'
  > | null;

  if (existing) {
    profile = existing as SidebarProfile;
  } else if (!fetchError) {
    // No row → create one from auth metadata
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
      .select('role, suspended, full_name, plan, email, avatar_url')
      .single();

    profile = (inserted as SidebarProfile | null) ?? null;
  }

  if (profile?.suspended) {
    redirect('/auth/login?error=suspended');
  }

  const userName =
    profile?.full_name || profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] : 'Hoïs Bazilik';

  // Defaults mirror the DB defaults so the UI is consistent even when
  // the prefs row hasn't been auto-healed yet.
  const effectivePrefs = {
    accent: prefs?.accent ?? 'both',
    density: prefs?.density ?? 'regular',
    dark_mode: prefs?.dark_mode ?? false,
    font_size: prefs?.font_size ?? 16,
    font_scale: prefs?.font_scale ?? 'medium',
    reduced_motion: prefs?.reduced_motion ?? false,
    high_contrast: prefs?.high_contrast ?? false,
    card_radius: prefs?.card_radius ?? 'rounded',
    language: prefs?.language ?? 'ht',
  };

  return (
    <UserAppearance prefs={effectivePrefs}>
      <div className="min-h-screen bg-cream-100 dark:bg-ink flex">
        <Sidebar
          isAdmin={profile?.role === 'admin'}
          userName={shortName}
          planLabel={planLabel}
          level={3}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </UserAppearance>
  );
}
