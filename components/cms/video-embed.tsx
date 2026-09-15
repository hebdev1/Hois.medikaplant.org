// Turns a YouTube / Vimeo / direct-file URL into a responsive embed. Pure
// presentational (no hooks) so it works in server and client components.

export function toEmbed(url: string): {
  kind: 'youtube' | 'vimeo' | 'file' | 'none';
  src: string;
} {
  if (!url || !url.trim()) return { kind: 'none', src: '' };
  const u = url.trim();
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (yt) return { kind: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vm[1]}` };
  return { kind: 'file', src: u };
}

/** Best-effort poster thumbnail for a video URL. YouTube links resolve to
 *  their hqdefault frame; everything else returns null (caller shows a
 *  placeholder or the video's own saved thumbnail). */
export function videoThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  const e = toEmbed(url);
  if (e.kind === 'youtube') {
    const id = e.src.split('/embed/')[1]?.split(/[?&]/)[0];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  }
  return null;
}

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const e = toEmbed(url);
  if (e.kind === 'none') {
    return (
      <div className="w-full aspect-video rounded-xl border border-dashed border-cream-300 bg-cream-50 grid place-items-center text-sm text-earth-400">
        Poko gen videyo
      </div>
    );
  }
  if (e.kind === 'file') {
    return (
      <video
        src={e.src}
        controls
        className="w-full rounded-xl border border-cream-200 bg-black"
      />
    );
  }
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cream-200 bg-black">
      <iframe
        src={e.src}
        title={title || 'Videyo'}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
