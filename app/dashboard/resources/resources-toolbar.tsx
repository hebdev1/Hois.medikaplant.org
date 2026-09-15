'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, FileText, Play, Volume2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'pdf' | 'video' | 'audio';

type Counts = Record<FilterType, number>;

const FILTERS: { id: FilterType; label: string; icon: typeof FileText | null }[] = [
  { id: 'all', label: 'Tout', icon: null },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'video', label: 'Videyo', icon: Play },
  { id: 'audio', label: 'Odyo', icon: Volume2 },
];

export default function ResourcesToolbar({ counts }: { counts: Counts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const currentFilter = (searchParams.get('type') as FilterType) ?? 'all';
  const currentQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = React.useState(currentQuery);

  // Debounce search input → URL
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (query === currentQuery) return;
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set('q', query.trim());
      } else {
        params.delete('q');
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(`/dashboard/resources${qs ? `?${qs}` : ''}`, {
          scroll: false,
        });
      });
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function pickType(id: FilterType) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') {
      params.delete('type');
    } else {
      params.set('type', id);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/dashboard/resources${qs ? `?${qs}` : ''}`, {
        scroll: false,
      });
    });
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 transition-opacity',
        isPending && 'opacity-60'
      )}
    >
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const active = currentFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => pickType(f.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all border',
              active
                ? 'bg-forest-700 text-cream-50 border-forest-700 shadow-sm'
                : 'bg-white text-earth-700 border-cream-200 hover:border-forest-300 hover:text-forest-700'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />}
            {f.label}
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1',
                active
                  ? 'bg-white/20 text-cream-50'
                  : 'bg-cream-100 text-earth-600'
              )}
            >
              {counts[f.id] ?? 0}
            </span>
          </button>
        );
      })}

      <label className="relative flex-1 min-w-[220px] sm:max-w-md ml-auto">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chèche nan dosye yo…"
          className="w-full pl-10 pr-9 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-earth-500 hover:text-ink rounded"
            aria-label="Efase rechèch"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
            ) : (
              <X className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
          </button>
        )}
      </label>
    </div>
  );
}
