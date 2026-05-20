'use client';

import React from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleSaveGuide } from '@/app/dashboard/guides/actions';

type Variant = 'icon' | 'pill';

type SaveGuideButtonProps = {
  guideId: string;
  initialSaved: boolean;
  variant?: Variant;
};

export default function SaveGuideButton({
  guideId,
  initialSaved,
  variant = 'pill',
}: SaveGuideButtonProps) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 2400);
    return () => clearTimeout(t);
  }, [error]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const previous = saved;
    setSaved(!previous);
    setPending(true);
    const res = await toggleSaveGuide(guideId);
    setPending(false);
    if (!res.ok) {
      setSaved(previous);
      setError(res.error);
      return;
    }
    setSaved(res.saved);
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? 'Retire nan sove' : 'Sove atik la'}
        title={saved ? 'Sove' : 'Sove atik la'}
        className={cn(
          'relative grid place-items-center w-9 h-9 rounded-full transition border',
          saved
            ? 'bg-gold-100 text-gold-600 border-gold-200'
            : 'bg-white text-earth-600 border-cream-200 hover:border-forest-300 hover:text-forest-700'
        )}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
        ) : saved ? (
          <BookmarkCheck className="w-4 h-4" strokeWidth={2.2} />
        ) : (
          <Bookmark className="w-4 h-4" strokeWidth={2.2} />
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition border',
          saved
            ? 'bg-gold-100 text-gold-700 border-gold-200 hover:bg-gold-200'
            : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
        )}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
        ) : saved ? (
          <BookmarkCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
        ) : (
          <Bookmark className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
        {saved ? 'Sove' : 'Sove pou apre'}
      </button>
      {error && (
        <span className="absolute top-full right-0 mt-1 text-[11px] text-rose-700 whitespace-nowrap bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
          {error}
        </span>
      )}
    </div>
  );
}
