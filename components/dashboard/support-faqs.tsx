'use client';

import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Faq = Database['public']['Tables']['support_faqs']['Row'];

type SupportFaqsProps = {
  faqs: Faq[];
  defaultOpenId?: string;
};

export default function SupportFaqs({ faqs, defaultOpenId }: SupportFaqsProps) {
  // Open the first FAQ by default for discoverability
  const [openId, setOpenId] = React.useState<string | null>(
    defaultOpenId ?? faqs[0]?.id ?? null
  );

  if (faqs.length === 0) {
    return (
      <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
        <header className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-forest-700" strokeWidth={2} />
          <h3 className="font-display text-lg font-bold text-ink">
            Kesyon yo poze <em className="text-forest-600 not-italic font-bold">plis</em>
          </h3>
        </header>
        <p className="text-sm text-earth-600">
          Poko gen kesyon ki disponib. Voye yon mesaj nan chat la — Ton vye la ap reponn.
        </p>
      </section>
    );
  }

  // Group by category so users with many FAQs can scan more easily
  const groups = new Map<string, Faq[]>();
  for (const f of faqs) {
    const key = f.category ?? 'Lòt';
    const arr = groups.get(key) ?? [];
    arr.push(f);
    groups.set(key, arr);
  }
  const orderedCategories = Array.from(groups.keys());

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-4 h-4 text-forest-700" strokeWidth={2} />
        <h3 className="font-display text-lg font-bold text-ink">
          Kesyon yo poze <em className="text-forest-600 not-italic font-bold">plis</em>
        </h3>
      </header>

      <div className="space-y-5">
        {orderedCategories.map((cat) => (
          <div key={cat}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-earth-500 font-semibold mb-2">
              {cat}
            </div>
            <ul className="space-y-2">
              {groups.get(cat)!.map((f) => {
                const isOpen = openId === f.id;
                return (
                  <li
                    key={f.id}
                    className={cn(
                      'rounded-xl border transition-colors overflow-hidden',
                      isOpen
                        ? 'bg-cream-50 border-forest-200'
                        : 'bg-cream-50/40 border-cream-200 hover:border-forest-200'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : f.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-start gap-3 text-left px-4 py-3 text-sm font-semibold text-ink"
                    >
                      <span className="flex-1">{f.question}</span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-earth-500 shrink-0 mt-0.5 transition-transform',
                          isOpen && 'rotate-180 text-forest-700'
                        )}
                        strokeWidth={2.2}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-earth-700 leading-relaxed whitespace-pre-wrap">
                        {f.answer}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
