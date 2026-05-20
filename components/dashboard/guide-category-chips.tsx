'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

type Category = {
  slug: string;
  label: string;
};

type Props = {
  categories: Category[];
  totalCount: number;
};

/**
 * URL-state filter chips. Selecting one writes `?cat=<slug>` and lets the
 * server re-render the page with the filter applied — bookmark-friendly,
 * shareable, and no flash of unfiltered content.
 */
export default function GuideCategoryChips({ categories, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('cat') ?? 'all';
  const [pending, startTransition] = useTransition();

  function pick(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', slug);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/dashboard/guides${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Filtre pa kategori"
      className={cn(
        'flex flex-wrap items-center gap-2 transition-opacity',
        pending && 'opacity-60'
      )}
    >
      <Chip
        active={current === 'all'}
        onClick={() => pick('all')}
        label={`Tout · ${totalCount}`}
      />
      {categories.map((c) => (
        <Chip
          key={c.slug}
          active={current === c.slug}
          onClick={() => pick(c.slug)}
          label={c.label}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border',
        active
          ? 'bg-forest-700 text-cream-50 border-forest-700 shadow-sm'
          : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
      )}
    >
      {label}
    </button>
  );
}
