import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import PromoteHeader from '@/components/ui/promote-header';
import Footer from '@/components/ui/footer';

export const metadata = {
  title: 'Videyo · Hoïs Medikaplant',
  description: 'Videyo edikatif sou plant, remèd tradisyonèl ak byennèt.',
};
export const dynamic = 'force-dynamic';

type VideoCard = {
  title: string;
  slug: string;
  thumbnail: string | null;
  category: string | null;
};

export default async function VideosIndex() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any;
  const { data } = await sb
    .from('cms_videos')
    .select('title, slug, thumbnail, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  const videos = (data ?? []) as VideoCard[];

  return (
    <>
      <PromoteHeader />
      <main className="min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <header className="max-w-2xl mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ink tracking-tight">
              Videyo
            </h1>
            <p className="mt-3 text-earth-600 md:text-lg">
              Aprann sou plant ak remèd tradisyonèl atravè videyo.
            </p>
          </header>

          {videos.length === 0 ? (
            <p className="text-earth-500 italic">Poko gen videyo pibliye.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => (
                <Link
                  key={v.slug}
                  href={`/videyo/${v.slug}`}
                  className="group flex flex-col rounded-2xl border border-cream-200 bg-white overflow-hidden shadow-card hover:border-forest-300 hover:-translate-y-0.5 transition"
                >
                  <div className="relative aspect-video bg-cream-100 overflow-hidden grid place-items-center">
                    {v.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <PlayCircle className="w-12 h-12 text-forest-300" strokeWidth={1.5} />
                    )}
                    <span className="absolute inset-0 grid place-items-center">
                      <PlayCircle
                        className="w-12 h-12 text-white/90 drop-shadow opacity-0 group-hover:opacity-100 transition"
                        strokeWidth={1.8}
                      />
                    </span>
                  </div>
                  <div className="p-5">
                    {v.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                        {v.category}
                      </span>
                    )}
                    <h2 className="mt-1 font-display text-lg font-bold text-ink leading-snug group-hover:text-forest-800 transition">
                      {v.title}
                    </h2>
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
