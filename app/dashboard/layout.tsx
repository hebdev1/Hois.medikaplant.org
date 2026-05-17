import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/sidebar';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, suspended')
    .eq('id', user.id)
    .single();

  if (profile?.suspended) {
    redirect('/auth/login?error=suspended');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isAdmin={profile?.role === 'admin'} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
