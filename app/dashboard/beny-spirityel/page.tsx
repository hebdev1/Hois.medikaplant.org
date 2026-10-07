import Link from 'next/link';
import { Bath, Lock, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import MelisUpsell from '@/components/dashboard/melis-upsell';

export const metadata = { title: 'Beny Spirityèl · MedikaPlant' };
export const dynamic = 'force-dynamic';

const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

type BathCard = {
  slug: string;
  title: string;
  intention: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
};

export default async function BenySpirityelPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Every member sees the published teasers; the recipe table itself is
  // Melis-only (RLS) and is only read on the detail page.
  const [{ data: profileRaw }, { data: bathsRaw }] = await Promise.all([
    supabase.from('profiles').select('plan, full_name, email, avatar_url').eq('id', user.id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('spiritual_baths')
      .select('slug, title, intention, excerpt, cover_image_url')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false }),
  ]);

  const profile = profileRaw as { plan: 'basic' | 'premium' | 'vip'; full_name: string | null; email: string; avatar_url: string | null } | null;
  const plan = profile?.plan ?? 'basic';
  const isMelis = plan === 'vip';
  const baths = (bathsRaw ?? []) as BathCard[];
  const shortName = (profile?.full_name || profile?.email.split('@')[0] || 'Manm').split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[plan]} · Spirityalite`}
        userId={user.id}
        userPlan={plan}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto grid gap-5 md:gap-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
            <Bath className="w-3.5 h-3.5" strokeWidth={2.2} />
            Spirityalite
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">Beny Spirityèl</h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
            Beny tradisyonèl pou pwoteksyon, netwayaj ak chans, ak resèt konplè pou chak youn.
          </p>
        </header>

        {!isMelis && (
          <MelisUpsell
            title="Beny Spirityèl yo rezève pou manm Melis."
            description="Ou ka wè lis beny yo anba a. Pase sou Melis pou debloke resèt konplè chak beny: engredyan, preparasyon, kijan pou benyen ak videyo."
          />
        )}

        {baths.length === 0 ? (
          <div className="bg-white border border-cream-200 rounded-2xl p-10 text-center shadow-card">
            <Bath className="w-8 h-8 text-earth-300 mx-auto mb-3" strokeWidth={1.6} />
            <p className="text-sm text-earth-600">Pa gen beny pibliye pou kounye a.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {baths.map((b) => (
              <li key={b.slug}>
                {isMelis ? (
                  <Link
                    href={`/dashboard/beny-spirityel/${b.slug}`}
                    className="group h-full flex flex-col bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover hover:border-gold-300 transition"
                  >
                    <BathCardBody bath={b} />
                    <span className="px-5 pb-5 mt-auto inline-flex items-center gap-1 text-[13px] font-semibold text-forest-700 group-hover:text-forest-800">
                      Wè resèt la
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </span>
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="h-full flex flex-col bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card"
                  >
                    <BathCardBody bath={b} locked />
                    <span className="px-5 pb-5 mt-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold-700">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
                      Rezève pou manm Melis
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function BathCardBody({ bath, locked = false }: { bath: BathCard; locked?: boolean }) {
  return (
    <>
      <div className="relative aspect-[4/3] bg-gradient-to-br from-cream-100 to-gold-100 grid place-items-center overflow-hidden">
        {bath.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bath.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Bath className="w-10 h-10 text-gold-600/60" strokeWidth={1.5} />
        )}
        {locked && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-forest-900/80 text-gold-200 text-[11px] font-bold">
            <Lock className="w-3 h-3" strokeWidth={2.6} />
            Melis
          </span>
        )}
      </div>
      <div className="p-5 pb-3">
        {bath.intention && (
          <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 text-[11px] font-semibold">
            {bath.intention}
          </span>
        )}
        <h2 className="font-display text-lg font-bold text-ink leading-snug">{bath.title}</h2>
        {bath.excerpt && <p className="mt-1.5 text-[13px] text-earth-600 leading-relaxed">{bath.excerpt}</p>}
      </div>
    </>
  );
}
