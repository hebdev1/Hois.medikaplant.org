import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Crown, ChevronRight, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import Avatar from '@/components/dashboard/avatar';
import { dateHT } from '../pwofil/profile-ui';

export const metadata = { title: 'Miray VIP · MedikaPlant' };
export const dynamic = 'force-dynamic';

type RosterRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  joined_at: string;
  level: number;
  level_name: string;
};

export default async function VipWallPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?redirect=/dashboard/vip/miray');

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, email, plan, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as {
    full_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
    avatar_url: string | null;
  } | null;
  if ((profile?.plan ?? 'basic') !== 'vip') redirect('/dashboard/vip');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc('vip_roster');
  const roster = (Array.isArray(data) ? data : []) as RosterRow[];

  const shortName = (
    profile?.full_name ||
    profile?.email.split('@')[0] ||
    'Manm'
  ).split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition="Hoïs Melis"
        userId={user.id}
        userPlan="vip"
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto grid gap-5 md:gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" strokeWidth={2.2} />
            Miray VIP
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Sèk Melis la
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
            Manm Hoïs Melis ki chwazi parèt nan sèk la. Klike sou yon manm pou w
            wè vitrin li.
          </p>
        </header>

        {roster.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-14 text-center">
            <Users className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
            <p className="text-sm text-earth-600 max-w-sm mx-auto">
              Poko gen manm nan sèk la. Ou ka premye a — ale nan Espas VIP epi
              chwazi &laquo;&nbsp;Parèt nan sèk Melis la&nbsp;&raquo;.
            </p>
            <Link
              href="/dashboard/vip"
              className="mt-4 inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-semibold transition"
            >
              Ale nan Espas VIP
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {roster.map((m) => (
              <Link
                key={m.user_id}
                href={`/dashboard/vip/pwofil/${m.user_id}`}
                className="group bg-white border border-cream-200 rounded-2xl p-4 shadow-card hover:border-gold-300 hover:shadow-cardHover transition flex items-center gap-3"
              >
                <span className="shrink-0">
                  <Avatar size={52} src={m.avatar_url} alt={m.display_name} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-ink leading-snug truncate group-hover:text-forest-700 transition">
                    {m.display_name}
                  </h3>
                  <div className="text-[11px] text-gold-700 font-semibold inline-flex items-center gap-1">
                    <Crown className="w-3 h-3" strokeWidth={2.4} />
                    Niv. {m.level} · {m.level_name}
                  </div>
                  {m.joined_at && (
                    <div className="text-[11px] text-earth-500 mt-0.5">
                      Nan sèk la depi {dateHT(m.joined_at)}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-earth-400 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.2} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
