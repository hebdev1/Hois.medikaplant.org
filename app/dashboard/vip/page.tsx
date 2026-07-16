import Link from 'next/link';
import { Crown, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import JoinVipButton from './join-button';

export const metadata = { title: 'VIP · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};
const UNLOCKED = new Set(['premium', 'vip']); // Sitwonèl + Melis

export default async function VipPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [{ data: profileRaw }, { data: vipRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('vip_members').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);

  const profile = profileRaw as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;

  const plan = profile?.plan ?? 'basic';
  const unlocked = UNLOCKED.has(plan);
  const joined = !!vipRaw;
  const shortName = (profile?.full_name || profile?.email.split('@')[0] || 'Manm').split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[plan]} · VIP`}
        userId={user.id}
        userPlan={plan}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[900px] mx-auto grid gap-5">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" strokeWidth={2.2} />
            Espas VIP
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Kominote VIP Hoïs
          </h1>
        </header>

        {!unlocked ? (
          // Locked — everyone sees the page, but it's gated to Sitwonèl+
          <div className="relative rounded-2xl border border-cream-200 bg-white shadow-card overflow-hidden">
            <div className="p-8 md:p-10 text-center">
              <span className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-cream-100 text-earth-500 mb-4">
                <Lock className="w-7 h-7" strokeWidth={1.8} />
              </span>
              <h2 className="font-display text-xl font-bold text-ink">
                Espas sa a rezève pou plan <span className="text-forest-700">Sitwonèl</span>
              </h2>
              <p className="mt-2 text-sm text-earth-600 max-w-md mx-auto">
                Pase sou plan Sitwonèl pou debloke espas VIP la ak tout avantaj
                li yo.
              </p>
              <Link
                href="/checkout?plan=premium"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-cream-50 font-semibold text-sm transition"
              >
                Pase sou Sitwonèl
                <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        ) : (
          // Unlocked — Sitwonèl (or Melis) member
          <div className="rounded-2xl bg-gradient-to-br from-forest-800 to-forest-900 text-cream-50 p-6 md:p-8 shadow-hero">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-300 mb-3">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
              Debloke
            </div>
            <h2 className="font-display text-2xl font-bold">
              Byenveni nan espas VIP la, {shortName}.
            </h2>
            <p className="mt-2 text-sm text-cream-200 max-w-xl">
              Kòm manm Sitwonèl, ou ka enskri nan kominote VIP la pou jwenn
              sesyon espesyal, priyorite sipò, ak avantaj rezève.
            </p>
            <div className="mt-5">
              <JoinVipButton joined={joined} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
