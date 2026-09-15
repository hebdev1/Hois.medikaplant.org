'use client';

// "Salon" tab of the member Telechajman library: the CMS videos (cms_videos,
// managed at /admin/videos) shown as thumbnail cards that open an in-dashboard
// modal player. Reuses the shared VideoEmbed (YouTube / Vimeo / file).

import React from 'react';
import { Play, X, Film } from 'lucide-react';
import { VideoEmbed } from '@/components/cms/video-embed';

export type SalonVideo = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  thumbnail: string | null;
  category: string | null;
};

export default function SalonGrid({ videos }: { videos: SalonVideo[] }) {
  const [active, setActive] = React.useState<SalonVideo | null>(null);

  // Lock body scroll + ESC to close while the player is open.
  React.useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setActive(null);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            className="group text-left bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card hover:border-forest-300 hover:shadow-plant transition flex flex-col"
          >
            <div className="relative aspect-video bg-ink/90 overflow-hidden">
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnail}
                  alt=""
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/40">
                  <Film className="w-8 h-8" strokeWidth={1.6} />
                </div>
              )}
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid place-items-center w-12 h-12 rounded-full bg-white/90 text-forest-700 shadow-lg group-hover:scale-110 transition">
                  <Play className="w-5 h-5 ml-0.5" strokeWidth={2.4} fill="currentColor" />
                </span>
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              {v.category && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-forest-700 mb-1">
                  {v.category}
                </span>
              )}
              <h3 className="font-display text-base font-bold text-ink leading-tight">
                {v.title}
              </h3>
              {v.description && (
                <p className="text-xs text-earth-600 mt-1.5 leading-relaxed line-clamp-2">
                  {v.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fèmen"
            onClick={() => setActive(null)}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur">
              <h3 className="font-display font-bold text-ink truncate pr-2">{active.title}</h3>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Fèmen"
                className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700 shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>
            <div className="p-4">
              {active.video_url ? (
                <VideoEmbed url={active.video_url} title={active.title} />
              ) : (
                <p className="text-sm text-earth-500">Pa gen videyo pou kounye a.</p>
              )}
              {active.description && (
                <p className="text-sm text-earth-600 mt-3 leading-relaxed">{active.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
