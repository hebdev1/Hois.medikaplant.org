'use client';

// A modal that lists the CMS Media Library so an editor can pick an image
// URL without leaving the block editor. Reused by the image block and the
// rich-text block's "insert image" action.

import React from 'react';
import { X, Loader2, ImageOff, Images } from 'lucide-react';
import {
  listMediaAssets,
  type MediaAssetLite,
} from '@/app/admin/(protected)/media/actions';

export function MediaPicker({
  onPick,
  onClose,
}: {
  onPick: (asset: MediaAssetLite) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = React.useState<MediaAssetLite[] | null>(null);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    listMediaAssets().then((list) => {
      if (alive) setAssets(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (!assets) return [];
    const term = q.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((a) =>
      (a.title ?? '').toLowerCase().includes(term)
    );
  }, [assets, q]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fèmen"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-3xl max-h-[86vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-cream-100">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Images className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
            Bibliyotèk Medya
          </h2>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Chèche…"
              className="px-3 py-1.5 rounded-lg border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fèmen"
              className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700"
            >
              <X className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          {assets === null ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-earth-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Ap chaje medya…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-earth-500">
              <ImageOff className="w-6 h-6 text-earth-400" strokeWidth={1.8} />
              {assets.length === 0 ? (
                <span>
                  Poko gen imaj. Ajoute yo nan{' '}
                  <span className="font-semibold">Medya → Bibliyotèk</span>.
                </span>
              ) : (
                <span>Pa gen rezilta pou « {q} ».</span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onPick(a)}
                  title={a.title ?? ''}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-cream-200 bg-cream-100 hover:border-forest-400 hover:ring-2 hover:ring-forest-200 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.alt_text ?? ''}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
