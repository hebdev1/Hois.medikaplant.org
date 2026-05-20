import Link from 'next/link';
import { BookOpen, Star, Clock, ChevronRight, Bookmark } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/dashboard/topbar';
import GuideCard from '@/components/dashboard/guide-card';
import GuideCategoryChips from '@/components/dashboard/guide-category-chips';
import SaveGuideButton from '@/components/dashboard/save-guide-button';
import PlantBig from '@/components/dashboard/plant-big';
import type { Database } from '@/types/database';

export const metadata = { title: 'Gid & Konsèy' };
export const dynamic = 'force-dynamic';

type Guide = Database['public']['Tables']['guides']['Row'];
type GuideArt = Database['public']['Enums']['guide_art'];
type Category = Database['public']['Tables']['guide_categories']['Row'];

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

const HT_DATE = new Intl.DateTimeFormat('fr-HT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const activeCatSlug = searchParams.cat;

  // Categories first — needed to resolve cat slug → id for the guides filter
  const [
    profileResult,
    categoriesResult,
    featuredResult,
    savesResult,
    unreadCountResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, plan')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('guide_categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('guides')
      .select('*')
      .eq('featured', true)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_guide_saves')
      .select('guide_id')
      .eq('user_id', user.id),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = profileResult.data as {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    plan: 'basic' | 'premium' | 'vip';
  } | null;
  const categories = (categoriesResult.data ?? []) as Category[];
  const featured = featuredResult.data as Guide | null;
  const savedIds = new Set(
    ((savesResult.data ?? []) as { guide_id: string }[]).map((s) => s.guide_id)
  );

  const activeCategory = activeCatSlug
    ? categories.find((c) => c.slug === activeCatSlug) ?? null
    : null;

  // Now query guides, filtered if a category is selected. Always exclude the
  // featured guide so it doesn't render twice on the page.
  let guidesQuery = supabase
    .from('guides')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (activeCategory) {
    guidesQuery = guidesQuery.eq('category_id', activeCategory.id);
  }
  if (featured) {
    guidesQuery = guidesQuery.neq('id', featured.id);
  }

  const { data: guidesData, count: totalCount } = await guidesQuery;
  const guides = (guidesData ?? []) as Guide[];

  // Total count for the "All" chip (no filter, includes featured)
  const { count: allCount } = await supabase
    .from('guides')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0];
  const planLabel = profile ? PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik' : 'Hoïs Bazilik';
  const unreadCount = (unreadCountResult.data as number | null) ?? 0;

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={planLabel}
        unreadCount={unreadCount}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1280px]">
        {/* Page header */}
        <header className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
            Gid & Konsèy
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Aprann, <em className="text-forest-600 not-italic font-bold">youn pa youn</em>.
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl">
            Atik, gid ak konsèy nan Kreyòl pa èrboris Ayisyen yo ak doktè
            patnè yo. Kontni nouvo chak semèn.
          </p>
        </header>

        {/* Filter chips */}
        <div className="mb-6">
          <GuideCategoryChips
            categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
            totalCount={allCount ?? 0}
          />
        </div>

        {/* Featured */}
        {!activeCategory && featured && (
          <FeaturedHero
            featured={featured}
            saved={savedIds.has(featured.id)}
          />
        )}

        {/* Grid */}
        {guides.length > 0 ? (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {guides.map((g) => (
              <div key={g.id} className="relative">
                <GuideCard guide={g} />
                <div className="absolute top-3 right-3 z-10">
                  <SaveGuideButton
                    guideId={g.id}
                    initialSaved={savedIds.has(g.id)}
                    variant="icon"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState category={activeCategory?.label ?? null} />
        )}

        {/* Saved shortcut */}
        {savedIds.size > 0 && (
          <SavedFooter count={savedIds.size} />
        )}
      </div>
    </>
  );
}

function FeaturedHero({
  featured,
  saved,
}: {
  featured: Guide;
  saved: boolean;
}) {
  return (
    <section className="relative overflow-hidden grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8 bg-gradient-to-br from-forest-800 to-forest-900 text-cream-50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-hero">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(201,162,39,0.35) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <div
        className="absolute -top-20 -right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${featured.accent_color}33` }}
        aria-hidden
      />

      {/* LEFT — art */}
      <div className="relative grid place-items-center min-h-[220px]">
        <PlantBig
          art={featured.art as GuideArt}
          accent={featured.accent_color}
          opacity={0.95}
          size={260}
        />
      </div>

      {/* RIGHT — body */}
      <div className="relative flex flex-col justify-center">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-300 font-semibold mb-3">
          <Star className="w-3 h-3 fill-gold-400" strokeWidth={0} />
          Atik vedèt
          {featured.tag && (
            <>
              <span aria-hidden>·</span>
              <span className="text-cream-200/80">{featured.tag}</span>
            </>
          )}
        </div>
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
          {featured.title}
        </h2>
        <p className="mt-4 text-cream-200 text-sm md:text-base leading-relaxed max-w-2xl">
          {featured.excerpt}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-cream-200/80">
          <span className="font-semibold text-cream-50">
            {featured.author_name}
          </span>
          {featured.author_role && (
            <>
              <span aria-hidden>·</span>
              <span>{featured.author_role}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={2.2} />
            {featured.read_minutes} min lekti
          </span>
          {featured.published_at && (
            <>
              <span aria-hidden>·</span>
              <span>Pibliye {HT_DATE.format(new Date(featured.published_at))}</span>
            </>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/guides/${featured.slug}`}
            className="inline-flex items-center gap-1.5 bg-gold-400 hover:bg-gold-300 text-forest-900 font-semibold px-5 py-2.5 rounded-full transition shadow-plant"
          >
            Li atik la
            <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
          </Link>
          <SaveGuideButton
            guideId={featured.id}
            initialSaved={saved}
            variant="pill"
          />
        </div>
      </div>
    </section>
  );
}

function EmptyState({ category }: { category: string | null }) {
  return (
    <div className="mt-8 rounded-2xl bg-cream-50 border border-dashed border-cream-200 p-12 text-center">
      <BookOpen
        className="w-8 h-8 text-earth-500 mx-auto mb-3"
        strokeWidth={1.6}
      />
      <p className="text-earth-700 font-semibold">
        {category
          ? `Pa gen atik nan kategori "${category}" ankò.`
          : 'Poko gen atik pibliye.'}
      </p>
      <p className="text-sm text-earth-600 mt-1">
        Ekip Hoïs ap pibliye nouvo kontni chak semèn — tcheke ankò byento.
      </p>
    </div>
  );
}

function SavedFooter({ count }: { count: number }) {
  return (
    <div className="mt-10 rounded-2xl bg-gold-50 border border-gold-200 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-gold-100 text-gold-700">
          <Bookmark className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">
            Ou gen {count} atik sove
          </div>
          <div className="text-xs text-earth-600">
            Yo rete disponib pou tout tan nan kont ou.
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/guides?cat=saved"
        className="text-xs font-semibold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1"
      >
        Wè sove yo
        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
