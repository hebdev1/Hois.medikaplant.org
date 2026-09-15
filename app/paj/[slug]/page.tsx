import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { PageBlocks, type Block } from '@/components/cms/page-blocks';

export const dynamic = 'force-dynamic';

type LoadedPage = {
  title: string;
  slug: string;
  blocks: Block[];
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
};

async function loadPage(slug: string): Promise<LoadedPage | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_pages')
    .select('title, slug, blocks, seo_title, seo_description, og_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return null;
  return { ...data, blocks: Array.isArray(data.blocks) ? data.blocks : [] } as LoadedPage;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await loadPage(params.slug);
  if (!page) return { title: 'Paj pa jwenn · Hoïs' };
  return {
    title: page.seo_title || page.title,
    description: page.seo_description || undefined,
    openGraph: page.og_image ? { images: [{ url: page.og_image }] } : undefined,
  };
}

export default async function PublicCmsPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await loadPage(params.slug);
  if (!page) notFound();

  return (
    <>
      <PromoteHeader />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-ink tracking-tight mb-8">
            {page.title}
          </h1>
          <PageBlocks blocks={page.blocks} />
        </article>
      </main>
      <Footer />
    </>
  );
}
