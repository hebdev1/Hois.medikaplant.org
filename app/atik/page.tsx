import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';

export const metadata = {
  title: 'Atik · Hoïs Medikaplant',
  description: 'Atik edikatif sou plant, remèd tradisyonèl ak byennèt natirèl.',
};
export const dynamic = 'force-dynamic';

type ArticleCard = {
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  published_at: string | null;
};

export default async function ArticlesIndex() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_articles')
    .select('title, slug, excerpt, cover_image, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  const articles = (data ?? []) as ArticleCard[];

  return (
    <>
      <PromoteHeader />
      <main className="min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <header className="max-w-2xl mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ink tracking-tight">
              Atik
            </h1>
            <p className="mt-3 text-earth-600 md:text-lg">
              Konesans sou plant, remèd tradisyonèl ak byennèt natirèl.
            </p>
          </header>

          {articles.length === 0 ? (
            <p className="text-earth-500 italic">Poko gen atik pibliye.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/atik/${a.slug}`}
                  className="group flex flex-col rounded-2xl border border-cream-200 bg-white overflow-hidden shadow-card hover:border-forest-300 hover:-translate-y-0.5 transition"
                >
                  <div className="aspect-[16/10] bg-cream-100 overflow-hidden">
                    {a.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.cover_image}
                        alt={a.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-forest-300 font-display text-2xl">
                        Hoïs
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {a.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 mb-1.5">
                        {a.category}
                      </span>
                    )}
                    <h2 className="font-display text-lg font-bold text-ink leading-snug group-hover:text-forest-800 transition">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="mt-2 text-sm text-earth-600 leading-relaxed line-clamp-3">
                        {a.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
