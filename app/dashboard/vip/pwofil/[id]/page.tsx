import { redirect } from 'next/navigation';
import { Award, GraduationCap, Users, Flame, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import { ProfileHeader, StatTile } from '../profile-ui';

export const metadata = { title: 'Pwofil VIP · MedikaPlant' };
export const dynamic = 'force-dynamic';

type Showcase = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  plan: string;
  level: number;
  level_name: string;
  streak: number;
  badges_unlocked: number;
  courses_completed: number;
  contributions: number;
};

export default async function MemberShowcasePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  // Your own id → full own profile.
  if (id === user.id) redirect('/dashboard/vip/pwofil');

  // Gated SECURITY DEFINER RPC: returns a row only if the caller is Melis and
  // the target opted into the circle; otherwise empty → not permitted.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc('vip_member_showcase', {
    target: id,
  });
  const row = (Array.isArray(data) ? data[0] : null) as Showcase | null;
  if (!row) redirect('/dashboard/vip/miray');

  // Topbar needs the viewer's own plan/name — keep it minimal.
  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const meRow = me as {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  const myName = (
    meRow?.full_name ||
    meRow?.email.split('@')[0] ||
    'Manm'
  ).split(' ')[0];

  return (
    <>
      <Topbar
        userName={myName}
        userCondition="Hoïs Melis"
        userId={user.id}
        userPlan="vip"
        avatarUrl={meRow?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto grid gap-5 md:gap-6">
        <ProfileHeader
          name={row.display_name}
          avatarUrl={row.avatar_url}
          memberSince={row.created_at}
          city={row.city}
          country={row.country}
          bio={row.bio}
          levelName={row.level_name}
          showBackToWall
        />

        {/* Compact level strip */}
        <section className="bg-white border border-gold-200 rounded-2xl p-5 shadow-card flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Crown className="w-5 h-5 text-gold-600" strokeWidth={2} />
            Nivo {row.level} · {row.level_name}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-sm font-bold text-gold-700">
            <Flame className="w-4 h-4" strokeWidth={2.2} />
            {row.streak} jou seri
          </span>
        </section>

        {/* Public showcase stats (no health/protocol data) */}
        <section className="grid grid-cols-3 gap-3 md:gap-4">
          <StatTile icon={Award} label="Badj debloke" value={row.badges_unlocked} />
          <StatTile icon={GraduationCap} label="Kou fini (sètifika)" value={row.courses_completed} />
          <StatTile icon={Users} label="Kontribisyon" value={row.contributions} />
        </section>

        <p className="text-[11px] text-earth-400 text-center">
          Se yon vitrin piblik — enfòmasyon sante rete prive.
        </p>
      </div>
    </>
  );
}
