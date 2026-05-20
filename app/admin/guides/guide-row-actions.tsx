'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Star,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  togglePublished,
  toggleFeatured,
  deleteGuide,
} from './actions';

type Props = {
  guideId: string;
  initialPublished: boolean;
  initialFeatured: boolean;
};

type Pending = 'publish' | 'feature' | 'delete' | null;

export default function GuideRowActions({
  guideId,
  initialPublished,
  initialFeatured,
}: Props) {
  const router = useRouter();
  const [published, setPublished] = React.useState(initialPublished);
  const [featured, setFeatured] = React.useState(initialFeatured);
  const [pending, setPending] = React.useState<Pending>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 2400);
    return () => clearTimeout(t);
  }, [error]);

  async function onTogglePublished() {
    setPending('publish');
    setError(null);
    const res = await togglePublished(guideId);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPublished(res.published);
  }

  async function onToggleFeatured() {
    setPending('feature');
    setError(null);
    const res = await toggleFeatured(guideId);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setFeatured(res.featured);
    // Re-fetch so other rows that just got un-featured re-render
    router.refresh();
  }

  async function onDelete() {
    setPending('delete');
    setError(null);
    const res = await deleteGuide(guideId);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirmingDelete(false);
    router.refresh();
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <IconButton
        title={published ? 'Depibliye' : 'Pibliye'}
        active={published}
        loading={pending === 'publish'}
        onClick={onTogglePublished}
        activeClass="bg-forest-100 text-forest-700 border-forest-200"
      >
        {published ? (
          <Eye className="w-4 h-4" strokeWidth={2.2} />
        ) : (
          <EyeOff className="w-4 h-4" strokeWidth={2.2} />
        )}
      </IconButton>

      <IconButton
        title={featured ? 'Retire vedèt' : 'Make vedèt'}
        active={featured}
        loading={pending === 'feature'}
        onClick={onToggleFeatured}
        activeClass="bg-gold-100 text-gold-700 border-gold-200"
      >
        <Star
          className={cn('w-4 h-4', featured && 'fill-current')}
          strokeWidth={2.2}
        />
      </IconButton>

      {!confirmingDelete ? (
        <IconButton
          title="Efase"
          loading={pending === 'delete'}
          onClick={() => setConfirmingDelete(true)}
          activeClass=""
          hoverClass="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.2} />
        </IconButton>
      ) : (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200">
          <span className="text-[11px] text-rose-700 font-semibold">Sèten?</span>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending === 'delete'}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 disabled:opacity-60 inline-flex items-center gap-1"
          >
            {pending === 'delete' && (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
            )}
            Wi
          </button>
          <span className="text-rose-300" aria-hidden>·</span>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            disabled={pending === 'delete'}
            className="text-[11px] font-semibold text-earth-600 hover:text-ink"
          >
            Non
          </button>
        </div>
      )}

      {error && (
        <span className="absolute top-full right-0 mt-1 text-[11px] text-rose-700 whitespace-nowrap bg-rose-50 border border-rose-200 px-2 py-0.5 rounded inline-flex items-center gap-1 z-10">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
          {error}
        </span>
      )}
    </div>
  );
}

function IconButton({
  title,
  active,
  loading,
  onClick,
  children,
  activeClass,
  hoverClass = 'hover:bg-cream-100 hover:text-ink',
}: {
  title: string;
  active?: boolean;
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass: string;
  hoverClass?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={loading}
      className={cn(
        'grid place-items-center w-8 h-8 rounded-lg border transition disabled:opacity-60 disabled:cursor-wait',
        active
          ? activeClass
          : `bg-white text-earth-600 border-cream-200 ${hoverClass}`
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
      ) : (
        children
      )}
    </button>
  );
}
