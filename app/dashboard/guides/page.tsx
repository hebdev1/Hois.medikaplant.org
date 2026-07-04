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
type Profile = {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  plan: 'basic' | 'premium' | 'vip';
};

const PLAN_LABELS: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

// Vercel's default Node runtime ships full-icu, but we keep the date format
// locale-agnostic ('en-GB' is essentially the same shape) and translate the
// month manually so we never depend on locale data that might be missing.
const MONTHS_HT = [
  'Janvye',
  'Fevriye',
  'Mas',
  'Avril',
  'Me',
  'Jen',
  'Jiyè',
  'Out',
  'Septanm',
  'Oktòb',
  'Novanm',
  'Desanm',
];

function formatHaitianDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_HT[d.getMonth()]} ${d.getFullYear()}`;
}

// Pull a single row out of a settled result and tolerate every failure mode
// (network, RLS, malformed cast). Anything weird returns the fallback.
function settledData<T>(
  result: PromiseSettledResult<{ data: unknown; error?: unknown } | null>,
  fallback: T
): T {
  if (result.status !== 'fulfilled') return fallback;
  const raw = result.value;
  if (!raw || raw.error) return fallback;
  return (raw.data as T | null) ?? fallback;
}

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

  // Fan-out fetch with allSettled so one failure doesn't kill the whole page.
  const [
    profileResult,
    categoriesResult,
    featuredResult,
    savesResult,
    allCountResult,
    unreadCountResult,
  ] = await Promise.allSettled([
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
    supabase.from('user_guide_saves').select('guide_id').eq('user_id', user.id),
    supabase
      .from('guides')
      .select('*', { count: 'exact', head: true })
      .eq('published', true),
    supabase.rpc('user_unread_notifications_count', { uid: user.id }),
  ]);

  const profile = settledData<Profile | null>(profileResult, null);
  const categories = settledData<Category[]>(categoriesResult, []);
  const featured = settledData<Guide | null>(featuredResult, null);
  const saveRows = settledData<Array<{ guide_id: string }>>(savesResult, []);
  const savedIds = new Set(saveRows.map((s) => s.guide_id));

  // allCount uses head:true, so .data is null and we need .count instead.
  // settledData<T>() walks the success path; we just inspect .count manually.
  const allCount =
    allCountResult.status === 'fulfilled' &&
    typeof (allCountResult.value as { count?: number | null })?.count === 'number'
      ? ((allCountResult.value as { count: number }).count ?? 0)
      : 0;

  const unreadCount =
    unreadCountResult.status === 'fulfilled' &&
    typeof (unreadCountResult.value as { data?: number | null })?.data === 'number'
      ? ((unreadCountResult.value as { data: number }).data ?? 0)
      : 0;

  // Resolve the active category from the URL ?cat= slug
  const activeCatSlug = searchParams.cat;
  const activeCategory = activeCatSlug
    ? categories.find((c) => c.slug === activeCatSlug) ?? null
    : null;

  // Pull the grid in a separate await so it can use the (now resolved) featured + category
  let guidesData: Guide[] = [];
  try {
    let q = supabase
      .from('guides')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(40);
    if (activeCategory) q = q.eq('category_id', activeCategory.id);
    if (featured) q = q.neq('id', featured.id);
    const { data } = await q;
    guidesData = (data ?? []) as Guide[];
  } catch (e) {
    console.error('[guides] grid fetch failed:', e);
  }

  const userName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Manm';
  const shortName = userName.split(' ')[0] || 'Manm';
  const planLabel = profile?.plan
    ? PLAN_LABELS[profile.plan] ?? 'Hoïs Bazilik'
    : 'Hoïs Bazilik';

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
           Dekouvri atik, gid pratik, ak konsèy sou sante an Kreyòl,Fransè ak anglè prepare pa doktè ayisyen ak doktè patnè nou yo.
           Nouvo kontni ajoute chak semèn pou ede w kontinye aprann epi pran pi bon swen sante w..
          </p>
        </header>

        {/* Filter chips */}
        {categories.length > 0 && (
          <div className="mb-6">
            <GuideCategoryChips
              categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
              totalCount={allCount}
            />
          </div>
        )}

        {/* Featured */}
        {!activeCategory && featured && (
          <FeaturedHero featured={featured} saved={savedIds.has(featured.id)} />
        )}

        {/* Grid */}
        {guidesData.length > 0 ? (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {guidesData.map((g) => (
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
        {savedIds.size > 0 && <SavedFooter count={savedIds.size} />}
      </div>
    </>
  );
}

function FeaturedHero({ featured, saved }: { featured: Guide; saved: boolean }) {
  const dateLabel = formatHaitianDate(featured.published_at);
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

      <div className="relative grid place-items-center min-h-[220px]">
        <PlantBig
          art={featured.art as GuideArt}
          accent={featured.accent_color}
          opacity={0.95}
          size={260}
        />
      </div>

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
          <span className="font-semibold text-cream-50">{featured.author_name}</span>
          {featured.author_role && (
            <>
              <span aria-hidden>·</span>
              <span>{featured.author_role}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={2.2} />
            {featured.read_minutes} men lekti
          </span>
          {dateLabel && (
            <>
              <span aria-hidden>·</span>
              <span>Pibliye {dateLabel}</span>
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
      <BookOpen className="w-8 h-8 text-earth-500 mx-auto mb-3" strokeWidth={1.6} />
      <p className="text-earth-700 font-semibold">
        {category
          ? `Pa gen atik nan kategori "${category}" ankò.`
          : 'Poko gen atik pibliye.'}
      </p>
      <p className="text-sm text-earth-600 mt-1">
        Ekip HOÏS la pibliye nouvo kontni chak semèn. Tounen vizite nou byento pou dekouvri dènye atik, gid, ak resous yo...
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
        href="/dashboard/guides"
        className="text-xs font-semibold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1"
      >
        Wè tout
        <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
