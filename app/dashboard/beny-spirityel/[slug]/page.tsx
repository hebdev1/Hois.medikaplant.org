import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Bath, Leaf, ListOrdered, Clock, TriangleAlert, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import { VideoEmbed } from '@/components/cms/video-embed';
import { sanitizeGuideHtml } from '@/lib/sanitize-html';

export const dynamic = 'force-dynamic';

const hasText = (html: string | null) =>
  !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

export default async function BenyDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('plan, full_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as { plan: 'basic' | 'premium' | 'vip'; full_name: string | null; email: string; avatar_url: string | null } | null;
  // The recipe is Melis-only (also enforced by RLS on spiritual_bath_recipes).
  if ((profile?.plan ?? 'basic') !== 'vip') redirect('/dashboard/beny-spirityel');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: bathRaw } = await sb
    .from('spiritual_baths')
    .select('id, title, intention, excerpt, cover_image_url, published')
    .eq('slug', params.slug)
    .maybeSingle();
  const bath = bathRaw as { id: string; title: string; intention: string | null; excerpt: string | null; cover_image_url: string | null; published: boolean } | null;
  if (!bath || !bath.published) notFound();

  const { data: recipeRaw } = await sb
    .from('spiritual_bath_recipes')
    .select('ingredients, preparation_html, usage_html, cautions_html, video_url')
    .eq('bath_id', bath.id)
    .maybeSingle();
  const recipe = recipeRaw as {
    ingredients: string[] | null;
    preparation_html: string | null;
    usage_html: string | null;
    cautions_html: string | null;
    video_url: string | null;
  } | null;
  const ingredients = recipe?.ingredients ?? [];
  const shortName = (profile?.full_name || profile?.email.split('@')[0] || 'Manm').split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition="Hoïs Melis · Spirityalite"
        userId={user.id}
        userPlan="vip"
        avatarUrl={profile?.avatar_url ?? null}
      />

      <article className="p-5 md:p-8 lg:p-10 max-w-[820px] mx-auto grid gap-6">
        <Link href="/dashboard/beny-spirityel" className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-forest-700 transition">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.2} /> Beny Spirityèl
        </Link>

        <header className="grid gap-5">
          {bath.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bath.cover_image_url} alt="" className="w-full aspect-[16/9] object-cover rounded-2xl border border-cream-200" />
          )}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold mb-3">
              <Bath className="w-3.5 h-3.5" strokeWidth={2.2} />
              {bath.intention || 'Beny Spirityèl'}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">{bath.title}</h1>
            {bath.excerpt && <p className="mt-3 text-lg text-earth-600 leading-relaxed">{bath.excerpt}</p>}
          </div>
        </header>

        {!recipe ? (
          <p className="text-sm text-earth-600 italic">Resèt la ap vin disponib byento.</p>
        ) : (
          <>
            {ingredients.length > 0 && (
              <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
                <SectionTitle icon={Leaf}>Engredyan</SectionTitle>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {ingredients.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[15px] text-ink">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasText(recipe.preparation_html) && (
              <section>
                <SectionTitle icon={ListOrdered}>Preparasyon</SectionTitle>
                <RichBody html={recipe.preparation_html!} />
              </section>
            )}

            {hasText(recipe.usage_html) && (
              <section>
                <SectionTitle icon={Clock}>Kijan pou benyen</SectionTitle>
                <RichBody html={recipe.usage_html!} />
              </section>
            )}

            {recipe.video_url && (
              <section>
                <SectionTitle icon={PlayCircle}>Videyo</SectionTitle>
                <VideoEmbed url={recipe.video_url} title={bath.title} />
              </section>
            )}

            {hasText(recipe.cautions_html) && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
                <SectionTitle icon={TriangleAlert} tone="warn">Prekosyon</SectionTitle>
                <RichBody html={recipe.cautions_html!} />
              </section>
            )}
          </>
        )}

        <p className="text-[10px] leading-snug text-earth-500 border-t border-cream-200 pt-4">
          Konesans tradisyonèl, pou edikasyon sèlman. Si w gen yon pwoblèm po,
          yon alèji oswa ou ansent, pale ak yon pwofesyonèl sante anvan.
        </p>
      </article>
    </>
  );
}

function SectionTitle({
  icon: Icon,
  tone = 'default',
  children,
}: {
  icon: typeof Leaf;
  tone?: 'default' | 'warn';
  children: React.ReactNode;
}) {
  return (
    <h2 className={`flex items-center gap-2 font-display text-xl font-bold mb-3 ${tone === 'warn' ? 'text-amber-900' : 'text-ink'}`}>
      <Icon className={`w-5 h-5 ${tone === 'warn' ? 'text-amber-600' : 'text-gold-600'}`} strokeWidth={2} />
      {children}
    </h2>
  );
}

function RichBody({ html }: { html: string }) {
  return (
    <div
      className="guide-rich-body space-y-4 text-base text-ink leading-relaxed"
      dangerouslySetInnerHTML={{ __html: sanitizeGuideHtml(html) }}
    />
  );
}
