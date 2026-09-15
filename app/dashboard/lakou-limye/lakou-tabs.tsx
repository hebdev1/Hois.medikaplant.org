'use client';

// Lakou Limyè member view: dynamic tabs (from lakou_tabs) whose assigned
// content — videos (modal player), audio (inline player), files (download),
// and articles (link) — renders per item kind. Reuses the shared VideoEmbed.

import React from 'react';
import Link from 'next/link';
import { Play, X, Film, Volume2, FileText, Download, Inbox, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoEmbed } from '@/components/cms/video-embed';

export type LakouItem = {
  kind: 'video' | 'audio' | 'file' | 'article';
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  thumbnail: string | null;
  href: string | null;
};

export type LakouTabData = {
  id: string;
  name: string;
  slug: string;
  items: LakouItem[];
};

export default function LakouTabs({
  tabs,
  initialSlug,
}: {
  tabs: LakouTabData[];
  initialSlug?: string;
}) {
  const first = tabs[0]?.slug ?? '';
  const [activeSlug, setActiveSlug] = React.useState(
    initialSlug && tabs.some((t) => t.slug === initialSlug) ? initialSlug : first
  );
  const [player, setPlayer] = React.useState<LakouItem | null>(null);

  React.useEffect(() => {
    if (!player) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPlayer(null);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', onKey);
    };
  }, [player]);

  const active = tabs.find((t) => t.slug === activeSlug) ?? tabs[0];

  if (tabs.length === 0) {
    return (
      <div className="rounded-2xl bg-cream-50 border border-dashed border-cream-200 p-10 md:p-14 text-center">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white border border-cream-200 text-earth-500 mx-auto mb-3">
          <Inbox className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div className="font-display text-lg font-bold text-ink">Poko gen anyen nan Lakou Limyè a.</div>
        <p className="text-sm text-earth-600 mt-1.5">Tab yo ap parèt la a lè yo pare.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const on = t.slug === active?.slug;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSlug(t.slug)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all border',
                on
                  ? 'bg-forest-700 text-cream-50 border-forest-700 shadow-sm'
                  : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
              )}
            >
              {t.name}
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1',
                  on ? 'bg-white/20 text-cream-50' : 'bg-cream-100 text-earth-600'
                )}
              >
                {t.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      {!active || active.items.length === 0 ? (
        <div className="rounded-2xl bg-cream-50 border border-dashed border-cream-200 p-10 md:p-14 text-center">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white border border-cream-200 text-earth-500 mx-auto mb-3">
            <Inbox className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="font-display text-lg font-bold text-ink">
            Poko gen kontni nan « {active?.name} ».
          </div>
          <p className="text-sm text-earth-600 mt-1.5">
            Kontni yo asiyen nan seksyon admin lan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {active.items.map((it) => (
            <LakouCard key={`${it.kind}-${it.id}`} item={it} onPlay={() => setPlayer(it)} />
          ))}
        </div>
      )}

      {/* Video modal */}
      {player && player.kind === 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fèmen"
            onClick={() => setPlayer(null)}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur">
              <h3 className="font-display font-bold text-ink truncate pr-2">{player.title}</h3>
              <button
                type="button"
                onClick={() => setPlayer(null)}
                aria-label="Fèmen"
                className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700 shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>
            <div className="p-4">
              {player.url ? (
                <VideoEmbed url={player.url} title={player.title} />
              ) : (
                <p className="text-sm text-earth-500">Pa gen videyo.</p>
              )}
              {player.description && (
                <p className="text-sm text-earth-600 mt-3 leading-relaxed">{player.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LakouCard({ item, onPlay }: { item: LakouItem; onPlay: () => void }) {
  // Article → link card
  if (item.kind === 'article') {
    return (
      <Link
        href={item.href || '#'}
        className="group bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card hover:border-forest-300 hover:shadow-plant transition flex flex-col"
      >
        <div className="relative aspect-video bg-cream-100 overflow-hidden">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full grid place-items-center text-earth-300">
              <FileText className="w-8 h-8" strokeWidth={1.6} />
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-display text-base font-bold text-ink leading-tight">{item.title}</h3>
          {item.description && (
            <p className="text-xs text-earth-600 mt-1.5 line-clamp-2">{item.description}</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
            Li atik la <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    );
  }

  // Audio → inline player card
  if (item.kind === 'audio') {
    return (
      <article className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Volume2 className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <h3 className="font-display text-base font-bold text-ink leading-tight">{item.title}</h3>
        </div>
        {item.description && (
          <p className="text-xs text-earth-600 mb-2 line-clamp-2">{item.description}</p>
        )}
        {item.url && <audio controls src={item.url} className="w-full mt-auto" />}
      </article>
    );
  }

  // File (non-audio resource) → download card
  if (item.kind === 'file') {
    return (
      <article className="bg-white border border-cream-200 rounded-2xl p-4 shadow-card flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <FileText className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <h3 className="font-display text-base font-bold text-ink leading-tight">{item.title}</h3>
        </div>
        {item.description && (
          <p className="text-xs text-earth-600 mb-3 line-clamp-2">{item.description}</p>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            download
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2.4} /> Telechaje
          </a>
        )}
      </article>
    );
  }

  // Video → thumbnail card → modal
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group text-left bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-card hover:border-forest-300 hover:shadow-plant transition flex flex-col"
    >
      <div className="relative aspect-video bg-ink/90 overflow-hidden">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
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
        <h3 className="font-display text-base font-bold text-ink leading-tight">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-earth-600 mt-1.5 line-clamp-2">{item.description}</p>
        )}
      </div>
    </button>
  );
}
