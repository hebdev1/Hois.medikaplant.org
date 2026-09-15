'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Video, Plus, Loader2, X, Trash2, ExternalLink } from 'lucide-react';
import { VideoEmbed } from '@/components/cms/video-embed';
import { saveVideo, setVideoStatus, deleteVideo } from './actions';

type Row = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  description: string | null;
  video_url: string | null;
  thumbnail: string | null;
  category: string | null;
};

export default function VideosAdmin({ videos }: { videos: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Row | null | 'new'>(null);

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[1100px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Video className="w-3.5 h-3.5" strokeWidth={2.2} />
            Videyo
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">Videyo yo</h1>
          <p className="mt-1.5 text-sm text-earth-600">
            {videos.length} videyo · YouTube, Vimeo oswa yon lyen fichye · /videyo
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Nouvo videyo
        </button>
      </header>

      <div className="bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden">
        {videos.length === 0 ? (
          <div className="p-10 text-center text-sm text-earth-500">Poko gen videyo.</div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {videos.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-4 md:px-5 py-3">
                <div className="w-16 h-10 rounded-lg bg-cream-100 overflow-hidden shrink-0 grid place-items-center">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-4 h-4 text-earth-400" strokeWidth={2} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink truncate">{v.title}</span>
                    {v.status === 'published' ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700">Pibliye</span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cream-200 text-earth-600">Bouyon</span>
                    )}
                  </div>
                  <div className="text-xs text-earth-500 font-mono truncate">/videyo/{v.slug}</div>
                </div>
                {v.status === 'published' && (
                  <a href={`/videyo/${v.slug}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-earth-600 hover:text-forest-700 px-2 py-1">
                    Wè <ExternalLink className="w-3 h-3" strokeWidth={2.4} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(v)}
                  className="text-xs font-bold text-forest-700 hover:text-forest-900 px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition"
                >
                  Modifye
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <VideoModal
          video={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function VideoModal({
  video,
  onClose,
  onChanged,
}: {
  video: Row | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = React.useState(video?.title ?? '');
  const [slug, setSlug] = React.useState(video?.slug ?? '');
  const [url, setUrl] = React.useState(video?.video_url ?? '');
  const [desc, setDesc] = React.useState(video?.description ?? '');
  const [thumb, setThumb] = React.useState(video?.thumbnail ?? '');
  const [category, setCategory] = React.useState(video?.category ?? '');
  const [status, setStatus] = React.useState(video?.status ?? 'draft');
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save(): Promise<string | null> {
    setBusy(true);
    setErr(null);
    const res = await saveVideo({
      id: video?.id,
      title,
      slug,
      description: desc,
      video_url: url,
      thumbnail: thumb,
      category,
    });
    setBusy(false);
    if (res.ok) return res.id ?? video?.id ?? null;
    setErr(res.error ?? 'Echwe.');
    return null;
  }

  async function saveAndClose() {
    const id = await save();
    if (id) onChanged();
  }

  async function togglePublish() {
    const id = await save();
    if (!id) return;
    setBusy(true);
    const next = status === 'published' ? 'draft' : 'published';
    const res = await setVideoStatus(id, next);
    setBusy(false);
    if (res.ok) {
      setStatus(next);
      onChanged();
    } else setErr(res.error ?? 'Echwe.');
  }

  async function remove() {
    if (!video?.id) return;
    setBusy(true);
    const res = await deleteVideo(video.id);
    setBusy(false);
    if (res.ok) onChanged();
    else setErr(res.error ?? 'Echwe.');
  }

  const inputCls =
    'mt-1 w-full px-3 py-2 rounded-lg border border-cream-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fèmen" onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-cream-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cream-100 sticky top-0 bg-white/95 backdrop-blur">
          <h2 className="font-display text-lg font-bold text-ink">
            {video ? 'Modifye videyo' : 'Nouvo videyo'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fèmen" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-cream-100 text-earth-700">
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Tit</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Slug</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="otomatik depi tit la" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Kategori</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Lyen videyo (YouTube / Vimeo / fichye)</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="https://youtube.com/watch?v=…" />
          </label>
          {url && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Apèsi</span>
              <div className="mt-1">
                <VideoEmbed url={url} title={title} />
              </div>
            </div>
          )}
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Deskripsyon</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-earth-600">Imaj miniyati (opsyonèl, URL)</span>
            <input value={thumb} onChange={(e) => setThumb(e.target.value)} className={`${inputCls} font-mono text-xs`} />
          </label>

          {err && <p className="text-xs text-rose-700">{err}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {video ? (
              !confirmDel ? (
                <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-sm font-semibold transition">
                  <Trash2 className="w-4 h-4" strokeWidth={2.2} /> Efase
                </button>
              ) : (
                <span className="flex items-center gap-1.5">
                  <button type="button" onClick={remove} disabled={busy} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-60">Konfime</button>
                  <button type="button" onClick={() => setConfirmDel(false)} className="px-2 text-sm text-earth-500">Anile</button>
                </span>
              )
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePublish}
                disabled={busy}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cream-300 bg-white text-ink text-sm font-bold hover:border-forest-300 disabled:opacity-60 transition"
              >
                {status === 'published' ? 'Retire' : 'Pibliye'}
              </button>
              <button
                type="button"
                onClick={saveAndClose}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-700 text-white text-sm font-bold shadow-card hover:bg-forest-800 disabled:opacity-60 transition"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Anrejistre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
