'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleTaskCompletion } from '@/app/dashboard/actions';

export type ChecklistItem = {
  id: string;
  title: string;
  meta: string;
  chip: string;
  chipKind: 'forest' | 'gold' | 'cream';
  done: boolean;
};

type ChecklistPanelProps = {
  initialTasks: ChecklistItem[];
};

const CHIP_STYLES: Record<ChecklistItem['chipKind'], string> = {
  forest: 'bg-forest-100 text-forest-700',
  gold: 'bg-gold-100 text-gold-600',
  cream: 'bg-cream-100 text-earth-700 border border-cream-200',
};

export default function ChecklistPanel({ initialTasks }: ChecklistPanelProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  // Keep state in sync when the server-rendered initial list changes (e.g. on revalidate)
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const doneCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  async function onToggle(id: string) {
    const previous = tasks;
    setError(null);
    // optimistic flip
    setTasks((curr) =>
      curr.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    setPendingIds((set) => new Set(set).add(id));

    const result = await toggleTaskCompletion(id);

    setPendingIds((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });

    if (!result.ok) {
      setTasks(previous); // rollback
      setError(result.error);
      return;
    }
    // Server revalidates the route → fresh data will arrive via the effect above.
    startTransition(() => {});
  }

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Aktivite <em className="text-forest-600 not-italic font-bold">jou a</em>
          </h2>
          <p className="text-xs text-earth-600 mt-0.5">
            Chak boks ou koche fè pyebwa ou pouse · {doneCount} / {total}
          </p>
        </div>
        <Link
          href="/dashboard/programs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 transition shrink-0"
        >
          Wè tout pwotokòl
          <ChevronRight className="w-3 h-3" strokeWidth={2.4} />
        </Link>
      </header>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {tasks.map((task) => {
          const pending = pendingIds.has(task.id);
          return (
            <li key={task.id}>
              <button
                onClick={() => onToggle(task.id)}
                disabled={pending}
                className={cn(
                  'group w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all disabled:cursor-not-allowed',
                  task.done
                    ? 'bg-forest-50/50 border-forest-100'
                    : 'bg-cream-50 border-cream-200 hover:border-forest-200 hover:bg-white'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid place-items-center w-5 h-5 rounded-md border-2 shrink-0 transition-all',
                    pending
                      ? 'bg-forest-100 border-forest-300 text-forest-700'
                      : task.done
                      ? 'bg-forest-600 border-forest-600 text-cream-50'
                      : 'bg-white border-cream-300 text-transparent group-hover:border-forest-400'
                  )}
                  aria-hidden
                >
                  {pending ? (
                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />
                  ) : (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-sm font-medium leading-snug',
                      task.done
                        ? 'text-earth-600 line-through decoration-forest-300'
                        : 'text-ink'
                    )}
                  >
                    {task.title}
                  </div>
                  <div className="text-[11px] text-earth-500 mt-0.5">
                    {task.meta}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0',
                    CHIP_STYLES[task.chipKind]
                  )}
                >
                  {task.chip}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
