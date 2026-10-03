import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import EnablePush from '@/components/push/enable-push';
import NotificationsList, { type NotifItem } from './notifications-list';

export const metadata = { title: 'Notifikasyon · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const MONTHS_HT = [
  'Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen',
  'Jiy', 'Out', 'Sep', 'Okt', 'Nov', 'Des',
];

function whenHT(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Kounye a';
  if (mins < 60) return `${mins} min pase`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} è pase`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} jou pase`;
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]}`;
}

export default async function NotificationsPage(props: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n: highlightParam } = await props.searchParams;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, email, plan, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileData as {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    avatar_url: string | null;
    created_at: string | null;
  } | null;
  const plan = profile?.plan ?? 'basic';
  // Members only see notifications sent AFTER they joined — a brand-new member
  // shouldn't inherit every historical broadcast as unread.
  const since = profile?.created_at ?? '1970-01-01T00:00:00Z';

  const [notifsRes, readsRes, unreadRes] = await Promise.all([
    // Scope to THIS member explicitly. RLS also lets admins read every row
    // (for the /admin panel), so relying on RLS alone would show an admin
    // every user's personal notifications in their own list.
    supabase
      .from('notifications')
      .select('id, title, message, link_url, created_at')
      .or(
        `target.eq.all,and(target.eq.plan,target_plan.eq.${plan}),and(target.eq.user,target_user_id.eq.${user.id})`
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);
  const shortName = (profile?.full_name || profile?.email?.split('@')[0] || 'Manm').split(' ')[0];

  const notifs = (notifsRes.data ?? []) as Array<{
    id: string;
    title: string;
    message: string | null;
    link_url: string | null;
    created_at: string;
  }>;
  const readIds = new Set(
    ((readsRes.data ?? []) as Array<{ notification_id: string }>).map(
      (r) => r.notification_id
    )
  );
  const unreadCount = (unreadRes.data as number | null) ?? 0;

  // Date labels are computed server-side and passed down so the client list
  // never recomputes relative time (avoids hydration mismatches).
  const items: NotifItem[] = notifs.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    link_url: n.link_url,
    when: whenHT(n.created_at),
  }));
  const highlightId =
    highlightParam && notifs.some((n) => n.id === highlightParam)
      ? highlightParam
      : null;

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={PLAN_LABEL[profile?.plan ?? 'basic']}
        unreadCount={unreadCount}
        userId={user.id}
        userPlan={profile?.plan ?? 'basic'}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[860px]">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Bell className="w-3.5 h-3.5" strokeWidth={2.2} />
            Notifikasyon
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Tout mesaj <em className="text-forest-600 not-italic font-bold">ou yo</em>
          </h1>
        </header>

        <div className="mb-6">
          <EnablePush />
        </div>

        <NotificationsList
          items={items}
          initialReadIds={[...readIds]}
          highlightId={highlightId}
        />
      </div>
    </>
  );
}
