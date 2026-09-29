import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import TutorialGuide from '@/components/dashboard/tutorial-guide';

export const metadata = { title: 'Titoryèl' };
export const dynamic = 'force-dynamic';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

export default async function TutorialPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [profileResult, unreadResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = profileResult.data as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    avatar_url: string | null;
  } | null;
  const unreadCount = (unreadResult.data as number | null) ?? 0;

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik' : 'Hoïs Bazilik';

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <div className="p-5 md:p-8 lg:p-10">
        <TutorialGuide />
      </div>
    </>
  );
}
