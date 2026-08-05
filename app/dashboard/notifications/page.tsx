import Link from 'next/link';
import { Bell, Inbox, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import MarkAllButton from './mark-all-button';

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

export default async function NotificationsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, email, plan, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileData as {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    avatar_url: string | null;
  } | null;
  const plan = profile?.plan ?? 'basic';

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
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
              <Bell className="w-3.5 h-3.5" strokeWidth={2.2} />
              Notifikasyon
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
              Tout mesaj <em className="text-forest-600 not-italic font-bold">ou yo</em>
            </h1>
          </div>
          {notifs.length > 0 && <MarkAllButton disabled={unreadCount === 0} />}
        </header>

        {notifs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-14 text-center">
            <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
            <p className="text-sm text-earth-600">Ou pa gen okenn notifikasyon.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {notifs.map((n) => {
              const unread = !readIds.has(n.id);
              const body = (
                <div
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition ${
                    unread
                      ? 'bg-forest-50/50 border-forest-200'
                      : 'bg-white border-cream-200'
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      unread ? 'bg-forest-600' : 'bg-cream-300'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold text-ink">{n.title}</h2>
                      <span className="text-[11px] text-earth-500 shrink-0 whitespace-nowrap">
                        {whenHT(n.created_at)}
                      </span>
                    </div>
                    {n.message && (
                      <p className="text-sm text-earth-700 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    )}
                    {n.link_url && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
                        Louvri <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
                      </span>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link_url ? (
                    <Link href={n.link_url} className="block">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
