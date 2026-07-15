'use client';

// Lazy, per-module playback. On click it calls the gated getModulePlayback
// server action (which checks enrollment) and renders the result: a <video>
// for storage-hosted files, an embed/link for external URLs. Signed URLs
// expire (~2h) — on a playback error we re-fetch once.

import React from 'react';
import { PlayCircle, Loader2, Lock, ExternalLink } from 'lucide-react';
import { getModulePlayback } from '@/app/dashboard/kou/actions';

/** Convert a YouTube/Vimeo watch URL to an embeddable URL, else null. */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === 'player.vimeo.com' || host === 'www.youtube.com') return url;
    return null;
  } catch {
    return null;
  }
}

type View =
  | { s: 'idle' }
  | { s: 'loading' }
  | { s: 'file'; url: string }
  | { s: 'embed'; url: string }
  | { s: 'error'; reason: string };

const REASON_MSG: Record<string, string> = {
  locked: 'Kontni sa a rezève pou moun ki enskri.',
  unauthenticated: 'Konekte pou gade kontni sa a.',
  no_source: 'Videyo a poko disponib.',
  not_found: 'Videyo a pa jwenn.',
};

export default function CourseVideoPlayer({ moduleId }: { moduleId: string }) {
  const [view, setView] = React.useState<View>({ s: 'idle' });
  const retried = React.useRef(false);

  async function load() {
    setView({ s: 'loading' });
    const res = await getModulePlayback(moduleId);
    if (!res.ok) {
      setView({ s: 'error', reason: res.reason });
      return;
    }
    setView(res.kind === 'file' ? { s: 'file', url: res.url } : { s: 'embed', url: res.url });
  }

  if (view.s === 'idle') {
    return (
      <button
        type="button"
        onClick={load}
        className="w-full flex items-center justify-center gap-2 py-6 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition"
      >
        <PlayCircle className="w-5 h-5" strokeWidth={2.2} />
        Gade videyo a
      </button>
    );
  }

  if (view.s === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-earth-600">
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
        Ap chaje videyo a…
      </div>
    );
  }

  if (view.s === 'error') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-cream-100 border border-cream-200 px-4 py-3 text-sm text-earth-700">
        <Lock className="w-4 h-4 shrink-0" strokeWidth={2.2} />
        {REASON_MSG[view.reason] ?? 'Nou pa rive chaje videyo a.'}
      </div>
    );
  }

  if (view.s === 'file') {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={view.url}
        controls
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full rounded-xl bg-black aspect-video"
        onError={() => {
          if (!retried.current) {
            retried.current = true;
            load(); // signed URL likely expired — re-mint once
          } else {
            setView({ s: 'error', reason: 'no_source' });
          }
        }}
      />
    );
  }

  // embed
  const embed = toEmbedUrl(view.url);
  if (embed) {
    return (
      <iframe
        src={embed}
        title="Videyo kou a"
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="w-full rounded-xl aspect-video border-0"
      />
    );
  }
  return (
    <a
      href={view.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-sm font-semibold transition"
    >
      <ExternalLink className="w-4 h-4" strokeWidth={2.2} />
      Louvri videyo a
    </a>
  );
}
