import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/sidebar';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
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

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, suspended, full_name, plan, email')
    .eq('id', user.id)
    .single();
  const profile = profileRaw as {
    role: 'user' | 'admin';
    suspended: boolean;
    full_name: string | null;
    plan: 'basic' | 'premium' | 'vip';
    email: string;
  } | null;

  if (profile?.suspended) {
    redirect('/auth/login?error=suspended');
  }

  const userName =
    profile?.full_name || profile?.email?.split('@')[0] || 'Manm';
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
