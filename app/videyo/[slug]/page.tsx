import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';
import { VideoEmbed } from '@/components/cms/video-embed';

export const dynamic = 'force-dynamic';

type LoadedVideo = {
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  category: string | null;
  thumbnail: string | null;
};

async function loadVideo(slug: string): Promise<LoadedVideo | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_videos')
    .select('title, slug, description, video_url, category, thumbnail')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return (data as LoadedVideo) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const v = await loadVideo(params.slug);
  if (!v) return { title: 'Videyo pa jwenn · Hoïs' };
  return {
    title: v.title,
    description: v.description || undefined,
    openGraph: v.thumbnail ? { images: [{ url: v.thumbnail }] } : undefined,
  };
}

export default async function VideoDetail({
  params,
}: {
  params: { slug: string };
}) {
  const v = await loadVideo(params.slug);
  if (!v) notFound();

  return (
    <>
      <PromoteHeader />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">
          {v.category && (
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-forest-700 mb-3">
              {v.category}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight mb-6">
            {v.title}
          </h1>
          {v.video_url && <VideoEmbed url={v.video_url} title={v.title} />}
          {v.description && (
            <p className="mt-6 text-ink/80 leading-relaxed whitespace-pre-wrap md:text-lg">
              {v.description}
            </p>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
