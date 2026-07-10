import Link from 'next/link';
import {
  ChevronRight,
  Download,
  FileText,
  Play,
  Volume2,
  Eye,
  Lock,
  Library,
  Inbox,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import Topbar from '@/components/dashboard/topbar';
import ResourcesToolbar from './resources-toolbar';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

export const metadata = { title: 'Telechajman · MedikaPlant' };
export const dynamic = 'force-dynamic';

type ResourceRow = Database['public']['Tables']['resources']['Row'];

const PLAN_RANK: Record<string, number> = { basic: 0, premium: 1, vip: 2 };
const PLAN_LABEL: Record<string, string> = {
  basic: 'Hoïs Bazilik',
  premium: 'Hoïs Sitwonèl',
  vip: 'Hoïs Melis',
};

function formatRelativeKreyol(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Jodi a';
  if (days === 1) return 'Yè';
  if (days < 7) return `${days} jou pase`;
  if (days < 14) return '1 semèn pase';
  if (days < 30) return `${Math.floor(days / 7)} semèn pase`;
  if (days < 60) return '1 mwa pase';
  if (days < 365) return `${Math.floor(days / 30)} mwa pase`;
  return `${Math.floor(days / 365)} ane pase`;
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes == null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 * 1024 * 1024) {
    const mo = bytes / (1024 * 1024);
    return `${mo < 10 ? mo.toFixed(1) : Math.round(mo)} Mo`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1) } Go`;
}

function formatDuration(seconds: number | null, type: string): string | null {
  if (seconds == null || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (type === 'audio' || type === 'video') {
    return `${mins} min`;
  }
  return `${mins} min`;
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { type?: string; q?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const [profileResult, allResourcesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, full_name, email')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('resources')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false }),
  ]);

  const profile = profileResult.data as {
    plan: 'basic' | 'premium' | 'vip';
    full_name: string | null;
    email: string;
  } | null;

  const allResources = (allResourcesResult.data ?? []) as ResourceRow[];

  // Counts per type (across the full library — independent of filter)
  const counts = {
    all: allResources.length,
    pdf: allResources.filter((r) => r.type === 'pdf').length,
    video: allResources.filter((r) => r.type === 'video').length,
    audio: allResources.filter((r) => r.type === 'audio').length,
  } as const;

  // Apply filters
  const filterType = searchParams.type as 'pdf' | 'video' | 'audio' | undefined;
  const query = searchParams.q?.toLowerCase().trim() ?? '';

  const filtered = allResources.filter((r) => {
    if (filterType && r.type !== filterType) return false;
    if (query) {
      const blob = `${r.title} ${r.description ?? ''} ${r.category ?? ''}`.toLowerCase();
      if (!blob.includes(query)) return false;
    }
    return true;
  });

  const userPlanRank = PLAN_RANK[profile?.plan ?? 'basic'] ?? 0;
  const userName =
    profile?.full_name || profile?.email.split('@')[0] || 'Manm';
  const shortName = userName.split(' ')[0];

  return (
    <>
      <Topbar
        userName={shortName}
        userCondition={`${PLAN_LABEL[profile?.plan ?? 'basic']} · Bibliyotèk`}
      />
      <div className="p-5 md:p-8 lg:p-10 max-w-[1320px] mx-auto grid gap-5 md:gap-6">
        {/* Header */}
        <header>
          <nav className="text-xs text-earth-600 mb-3 flex items-center gap-1.5">
            <Link href="/dashboard" className="hover:text-forest-700 transition">
              Tablodebò
            </Link>
            <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
            <span className="text-ink font-medium">Telechajman</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <Library className="w-3.5 h-3.5" strokeWidth={2.2} />
            Bibliyotèk
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Telechajman <em className="text-forest-600 not-italic font-bold">w yo</em>
          </h1>
          <p className="mt-2 text-sm md:text-base text-earth-600 max-w-2xl leading-relaxed">
            {counts.all} Resous ki disponib: Gid an PDF, videyo, ak meditasyon odyo 
            ki disponib sèlman pou manm ki abòne ak Plan HOÏS yo.
          </p>
        </header>

        {/* Toolbar */}
        <ResourcesToolbar counts={counts} />

        {/* Grid or empty state */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-cream-50 border border-dashed border-cream-200 p-10 md:p-14 text-center">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white border border-cream-200 text-earth-500 mx-auto mb-3">
              <Inbox className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="font-display text-lg font-bold text-ink">
              Pa gen okenn dosye ki koresponn ak rechèch ou.
            </div>
            <p className="text-sm text-earth-600 mt-1.5">
              Eseye chanje filtè yo oswa itilize lòt mo kle nan ba rechèch la.
            </p>
            {(filterType || query) && (
              <Link
                href="/dashboard/resources"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-forest-700 hover:text-forest-800"
              >
                Retounen filtè yo nan eta orijinal yo
                <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filtered.map((r) => {
              const locked = (PLAN_RANK[r.plan_required] ?? 0) > userPlanRank;
              return (
                <FileCard
                  key={r.id}
                  resource={r}
                  locked={locked}
                  lockReason={
                    locked
                      ? `Bezwen plan ${PLAN_LABEL[r.plan_required]}`
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── File card ────────────────────────────────────────────────────────────

const TYPE_META: Record<
  string,
  { icon: typeof FileText; iconTone: string; label: string; previewLabel: string }
> = {
  pdf: {
    icon: FileText,
    iconTone: 'bg-rose-100 text-rose-700 border-rose-200',
    label: 'PDF',
    previewLabel: 'Gade',
  },
  video: {
    icon: Play,
    iconTone: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    label: 'VIDEYO',
    previewLabel: 'Jwe',
  },
  audio: {
    icon: Volume2,
    iconTone: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'ODYO',
    previewLabel: 'Koute',
  },
};

function FileCard({
  resource,
  locked,
  lockReason,
}: {
  resource: ResourceRow;
  locked: boolean;
  lockReason?: string;
}) {
  const meta = TYPE_META[resource.type] ?? TYPE_META.pdf;
  const Icon = meta.icon;

  const size = formatFileSize(resource.file_size_bytes);
  const duration = formatDuration(resource.duration_seconds, resource.type);
  const lengthLabel =
    resource.type === 'pdf'
      ? duration ?? size ?? '—'
      : duration ?? size ?? '—';

  return (
    <article className="bg-white border border-cream-200 rounded-2xl p-4 md:p-5 shadow-card flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border',
            meta.iconTone
          )}
        >
          <Icon className="w-4 h-4" strokeWidth={2.2} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {meta.label}
          </span>
        </div>
        {resource.category && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cream-100 text-earth-700 border border-cream-200">
            {resource.category}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <h3 className="font-display text-base md:text-lg font-bold text-ink leading-tight">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs md:text-sm text-earth-600 mt-1.5 leading-relaxed line-clamp-3">
            {resource.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-earth-500 flex-wrap">
        <span>{lengthLabel}</span>
        {duration && size && (
          <>
            <span aria-hidden className="text-cream-300">·</span>
            <span>{size}</span>
          </>
        )}
        <span aria-hidden className="text-cream-300">·</span>
        <span>{formatRelativeKreyol(resource.created_at)}</span>
      </div>

      <div className="mt-3 pt-3 border-t border-cream-100 flex items-center gap-2">
        {locked ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cream-100 text-earth-600 border border-cream-200 flex-1 justify-center"
            title={lockReason}
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
            {lockReason ?? 'Plan ki pi wo'}
          </span>
        ) : (
          <>
            <a
              href={resource.file_url}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-lg transition flex-1"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2.4} />
              Telechaje
            </a>
            <a
              href={resource.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 bg-white hover:bg-cream-50 border border-cream-200 hover:border-forest-300 text-earth-700 hover:text-forest-700 rounded-lg transition shrink-0"
              title={meta.previewLabel}
              aria-label={meta.previewLabel}
            >
              {resource.type === 'pdf' ? (
                <Eye className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Play className="w-4 h-4" strokeWidth={2} />
              )}
            </a>
          </>
        )}
      </div>
    </article>
  );
}
