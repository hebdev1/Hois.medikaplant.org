import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { PageBlocks, type Block } from '@/components/cms/page-blocks';

export const dynamic = 'force-dynamic';

type LoadedArticle = {
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  blocks: Block[];
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
};

async function loadArticle(slug: string): Promise<LoadedArticle | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_articles')
    .select(
      'title, slug, excerpt, cover_image, category, tags, blocks, seo_title, seo_description, published_at'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
  } as LoadedArticle;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const a = await loadArticle(params.slug);
  if (!a) return { title: 'Atik pa jwenn · Hoïs' };
  return {
    title: a.seo_title || a.title,
    description: a.seo_description || a.excerpt || undefined,
    openGraph: a.cover_image ? { images: [{ url: a.cover_image }] } : undefined,
  };
}

export default async function ArticleDetail({
  params,
}: {
  params: { slug: string };
}) {
  const a = await loadArticle(params.slug);
  if (!a) notFound();

  return (
    <>
      <PromoteHeader />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">
          {a.category && (
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-forest-700 mb-3">
              {a.category}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-5xl font-bold text-ink tracking-tight">
            {a.title}
          </h1>
          {a.excerpt && (
            <p className="mt-4 text-lg text-earth-600 leading-relaxed">{a.excerpt}</p>
          )}
          {a.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.cover_image}
              alt={a.title}
              className="mt-6 w-full rounded-2xl border border-cream-200"
            />
          )}
          <div className="mt-8">
            <PageBlocks blocks={a.blocks} />
          </div>
          {a.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-cream-200 flex flex-wrap gap-2">
              {a.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cream-100 text-earth-600"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
