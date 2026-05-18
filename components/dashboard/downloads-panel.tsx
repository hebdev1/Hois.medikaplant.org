import React from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, Video, Music, Download, type LucideIcon } from 'lucide-react';
import type { Resource } from '@/types/database';

type DownloadsPanelProps = {
  resources: Pick<
    Resource,
    'id' | 'title' | 'description' | 'type' | 'file_url' | 'created_at' | 'duration_seconds' | 'file_size_bytes' | 'category'
  >[];
};

const TYPE_LABEL: Record<Resource['type'], string> = {
  pdf: 'PDF',
  video: 'VIDEO',
  audio: 'AUDIO',
};

const TYPE_ICON: Record<Resource['type'], LucideIcon> = {
  pdf: FileText,
  video: Video,
  audio: Music,
};

const TYPE_BG: Record<Resource['type'], string> = {
  pdf: 'bg-rose-50 text-rose-700 border-rose-100',
  video: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  audio: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.round(diffMs / 86400000);
  if (days <= 0) return 'Mete la jodi a';
  if (days === 1) return '1 jou pase';
  if (days < 30) return `${days} jou pase`;
  const months = Math.round(days / 30);
  if (months === 1) return '1 mwa pase';
  return `${months} mwa pase`;
}

export default function DownloadsPanel({ resources }: DownloadsPanelProps) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Dosye <em className="text-forest-600 not-italic font-bold">resan</em>
          </h2>
          <p className="text-xs text-earth-600 mt-0.5">
            Gid, videyo ak odyo pou plan ou
          </p>
        </div>
        <Link
          href="/dashboard/resources"
          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 transition shrink-0"
        >
          Tout dosye yo
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
        </Link>
      </header>

      {resources.length === 0 ? (
        <p className="text-sm text-earth-500 text-center py-8">
          Pa gen dosye disponib pou plan ou kounye a.
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => {
            const Icon = TYPE_ICON[r.type];
            const meta = [
              formatDuration(r.duration_seconds),
              formatSize(r.file_size_bytes),
              timeAgo(r.created_at),
              r.category,
            ].filter(Boolean) as string[];

            const verb = r.type === 'pdf' ? 'Gade' : r.type === 'video' ? 'Gade videyo' : 'Koute';

            return (
              <li
                key={r.id}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 p-3 rounded-xl bg-cream-50 border border-cream-200 hover:border-forest-200 hover:bg-white transition"
              >
                <div
                  className={`grid place-items-center w-11 h-11 rounded-lg border text-[10px] font-bold tracking-wide ${TYPE_BG[r.type]}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">
                    {r.title}
                  </div>
                  <div className="text-[11px] text-earth-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-earth-700">{TYPE_LABEL[r.type]}</span>
                    {meta.map((m, i) => (
                      <React.Fragment key={i}>
                        <span aria-hidden>·</span>
                        <span>{m}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 px-3 py-1.5 rounded-full border border-cream-200 hover:border-forest-300 transition"
                >
                  {verb}
                </a>
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 px-3 py-1.5 rounded-full transition"
                >
                  <Download className="w-3 h-3" strokeWidth={2.4} />
                  Telechaje
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

