'use client';

import React from 'react';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  Volume2,
  X,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export type ResourceKind = 'pdf' | 'video' | 'audio' | 'other';

export type UploadedFile = {
  url: string;
  path: string;
  sizeBytes: number;
  durationSeconds: number | null;
  mimeType: string;
  originalName: string;
  detectedKind: ResourceKind;
};

type Props = {
  /** Existing file_url to render the "current file" pill */
  initialUrl?: string | null;
  initialSizeBytes?: number | null;
  initialDurationSeconds?: number | null;
  /**
   * Fires after a successful upload. The form uses this to populate the
   * hidden file_url + duration + size fields and to suggest a type.
   */
  onUploaded?: (file: UploadedFile) => void;
  /** Fires when the admin clears the current file (without deleting on server). */
  onCleared?: () => void;
};

const MAX_BYTES = 1024 * 1024 * 1024; // 1 GB (matches bucket cap)
const BUCKET = 'resources';

function detectKind(mimeOrName: string, name: string): ResourceKind {
  const mime = mimeOrName.toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (mime.startsWith('video/') || ['mp4', 'mov', 'webm', 'm4v', 'mkv'].includes(ext)) {
    return 'video';
  }
  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)
  ) {
    return 'audio';
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  return 'other';
}

function safeFilename(name: string): string {
  // Strip diacritics, collapse spaces, drop characters that confuse object
  // storage paths. Keep dots so the extension survives.
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 * 1024 * 1024) {
    const mo = bytes / (1024 * 1024);
    return `${mo < 10 ? mo.toFixed(1) : Math.round(mo)} Mo`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

/** Read duration via HTML5 media element. Resolves null if unsupported. */
async function detectDurationFromBlob(
  blob: Blob,
  kind: ResourceKind
): Promise<number | null> {
  if (kind !== 'video' && kind !== 'audio') return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const el = document.createElement(kind);
    el.preload = 'metadata';
    el.src = url;
    let done = false;
    const finish = (val: number | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(val);
    };
    el.onloadedmetadata = () => {
      const d = el.duration;
      finish(Number.isFinite(d) && d > 0 ? Math.round(d) : null);
    };
    el.onerror = () => finish(null);
    // Safety net so we don't hang forever
    setTimeout(() => finish(null), 5000);
  });
}

export default function ResourceUpload({
  initialUrl,
  initialSizeBytes,
  initialDurationSeconds,
  onUploaded,
  onCleared,
}: Props) {
  const supabase = React.useMemo(() => createClient(), []);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploaded, setUploaded] = React.useState<UploadedFile | null>(null);

  // Derive the "current" view from either an existing url (edit mode) or the
  // just-uploaded file.
  const current =
    uploaded ??
    (initialUrl
      ? {
          url: initialUrl,
          path: initialUrl.split('/storage/v1/object/public/resources/')[1] ?? '',
          sizeBytes: initialSizeBytes ?? 0,
          durationSeconds: initialDurationSeconds ?? null,
          mimeType: '',
          originalName: initialUrl.split('/').pop() ?? 'fichye',
          detectedKind: 'other' as ResourceKind,
        }
      : null);

  async function startUpload(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`Fichye a twò gwo (maks 1 Go). Gwosè aktyèl: ${formatBytes(file.size)}.`);
      return;
    }

    setUploading(true);
    setProgress(8);

    const kind = detectKind(file.type, file.name);
    // Best-effort duration detection (small blob slice if huge)
    const durationSeconds = await detectDurationFromBlob(file, kind);
    setProgress(20);

    // Path scheme: yyyy/mm/<uuid>-<sanitized-filename>
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const id = crypto.randomUUID();
    const filename = safeFilename(file.name) || 'file';
    const path = `${year}/${month}/${id}-${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
    setProgress(85);

    if (uploadError) {
      setError(`Upload echwe: ${uploadError.message}`);
      setUploading(false);
      setProgress(0);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const result: UploadedFile = {
      url: publicUrl,
      path,
      sizeBytes: file.size,
      durationSeconds,
      mimeType: file.type,
      originalName: file.name,
      detectedKind: kind,
    };

    setUploaded(result);
    setProgress(100);
    setUploading(false);
    onUploaded?.(result);
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
    // allow re-selecting the same file later
    if (inputRef.current) inputRef.current.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  }

  function clearFile() {
    setUploaded(null);
    onCleared?.();
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (current) {
    const Icon =
      current.detectedKind === 'video'
        ? Play
        : current.detectedKind === 'audio'
          ? Volume2
          : FileText;
    return (
      <div className="rounded-xl border border-cream-200 bg-cream-50/60 p-3">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-white border border-cream-200 text-forest-700 shrink-0">
            <Icon className="w-5 h-5" strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink truncate">
              {current.originalName}
            </div>
            <div className="text-[11px] text-earth-600 mt-0.5 flex items-center gap-2 flex-wrap">
              {current.sizeBytes > 0 && <span>{formatBytes(current.sizeBytes)}</span>}
              {current.sizeBytes > 0 && current.durationSeconds && (
                <span aria-hidden className="text-cream-300">
                  ·
                </span>
              )}
              {current.durationSeconds && (
                <span>{Math.round(current.durationSeconds / 60)} min</span>
              )}
              <span aria-hidden className="text-cream-300">
                ·
              </span>
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-800 hover:underline"
              >
                Wè fichye <ExternalLink className="w-3 h-3" strokeWidth={2.2} />
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            aria-label="Retire fichye"
            className="grid place-items-center w-8 h-8 rounded-lg bg-white border border-cream-200 text-earth-600 hover:border-rose-300 hover:text-rose-700 transition shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 rounded-lg transition"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2.2} />
            Ranplase fichye
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
            {uploaded ? 'Fenk monte' : 'Estoke'}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFileSelected}
          disabled={uploading}
        />
      </div>
    );
  }

  return (
    <>
      <label
        htmlFor="resource-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition text-center',
          dragOver
            ? 'border-forest-500 bg-forest-50'
            : 'border-cream-300 bg-cream-50/40 hover:border-forest-300 hover:bg-cream-50'
        )}
      >
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white border border-cream-200 text-forest-700">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.2} />
          ) : (
            <Upload className="w-5 h-5" strokeWidth={2.2} />
          )}
        </span>
        <div className="font-display text-base font-bold text-ink">
          {uploading ? 'Ap monte fichye…' : 'Glise yon fichye oswa klike pou chwazi'}
        </div>
        <div className="text-[11px] text-earth-600 max-w-xs leading-relaxed">
          PDF, videyo (MP4/MOV/WebM), odyo (MP3/WAV/M4A) — oswa nenpòt lòt
          fòma. Maks 1 Go.
        </div>
        <input
          ref={inputRef}
          id="resource-file"
          type="file"
          className="sr-only"
          onChange={onFileSelected}
          disabled={uploading}
        />
        {uploading && (
          <div className="w-full max-w-xs mt-2">
            <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-earth-500 mt-1">{progress}%</div>
          </div>
        )}
      </label>
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.4} />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
