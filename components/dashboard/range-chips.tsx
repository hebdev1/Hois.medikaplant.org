'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';
import { RANGES, type Range } from './range-utils';

// Re-export so existing import sites that grabbed Range/DEFAULT_RANGE/
// rangeFromSearch from this file don't break. Server components should
// import directly from './range-utils' (no 'use client'), but client
// callers can keep going through here.
export { DEFAULT_RANGE, rangeFromSearch, type Range } from './range-utils';

export default function RangeChips({ active }: { active: Range }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pick(days: Range) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', String(days));
    startTransition(() => {
      router.push(`/dashboard/health?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Peryod lekti"
      className={cn(
        'inline-flex p-1 rounded-xl bg-cream-100 border border-cream-200 transition-opacity',
        pending && 'opacity-60'
      )}
    >
      {RANGES.map((r) => {
        const isActive = r === active;
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => pick(r)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              isActive
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-earth-600 hover:text-ink'
            )}
          >
            {r} jou
          </button>
        );
      })}
    </div>
  );
}
