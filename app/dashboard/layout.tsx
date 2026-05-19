import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/sidebar';

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

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('role, suspended, full_name, plan, email')
    .eq('id', user.id)
    .maybeSingle();

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
      .select('role, suspended, full_name, plan, email')
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

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar
        isAdmin={profile?.role === 'admin'}
        userName={shortName}
        planLabel={planLabel}
        level={3}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
