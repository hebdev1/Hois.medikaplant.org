'use client';

import type { RemedCondition } from './use-remed-search';

export default function ConditionChips({
  conditions,
  onSelect,
}: {
  conditions: RemedCondition[];
  onSelect: (c: RemedCondition) => void;
}) {
  if (conditions.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-500 mb-2">
        Kondisyon popilè
      </div>
      <div className="flex flex-wrap gap-1.5">
        {conditions.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelect(c)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-forest-50 hover:bg-forest-100 border border-forest-100 hover:border-forest-300 text-xs font-semibold text-forest-800 transition"
          >
            {c.emoji && <span aria-hidden>{c.emoji}</span>}
            {c.name_ht}
          </button>
        ))}
      </div>
    </div>
  );
}
