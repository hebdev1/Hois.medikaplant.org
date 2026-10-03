'use client';

// Client inbox list: filter tabs (Tout / Poko li), mark-read-on-open (clicking
// an item clears its unread dot and follows its link when it has one),
// per-item "Make poko li" undo, and deep-link highlight (?n=<id> from a push
// scrolls to the message, rings it briefly, and marks it read).

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, CheckCheck, RotateCcw, Inbox } from 'lucide-react';
import {
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
} from './actions';

export type NotifItem = {
  id: string;
  title: string;
  message: string | null;
  link_url: string | null;
  when: string;
};

export default function NotificationsList({
  items,
  initialReadIds,
  highlightId,
}: {
  items: NotifItem[];
  initialReadIds: string[];
  highlightId: string | null;
}) {
  const router = useRouter();
  const [readIds, setReadIds] = React.useState<Set<string>>(
    () => new Set(initialReadIds)
  );
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [highlighted, setHighlighted] = React.useState<string | null>(highlightId);
  const [, startTransition] = React.useTransition();

  const markRead = React.useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      startTransition(() => {
        void markNotificationRead(id);
      });
    },
    []
  );

  const markUnread = React.useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    startTransition(() => {
      void markNotificationUnread(id);
    });
  }, []);

  const markAll = React.useCallback(() => {
    setReadIds(new Set(items.map((i) => i.id)));
    startTransition(() => {
      void markAllNotificationsRead();
    });
  }, [items]);

  // Deep-link from a push: scroll to the message, ring it, and mark it read.
  React.useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`notif-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    markRead(highlightId);
    const t = setTimeout(() => setHighlighted(null), 2800);
    return () => clearTimeout(t);
  }, [highlightId, markRead]);

  function openItem(item: NotifItem) {
    markRead(item.id);
    if (!item.link_url) return;
    if (/^https?:\/\//i.test(item.link_url)) {
      window.location.href = item.link_url;
    } else {
      router.push(item.link_url);
    }
  }

  const unreadTotal = items.reduce((n, i) => (readIds.has(i.id) ? n : n + 1), 0);
  const visible = filter === 'unread' ? items.filter((i) => !readIds.has(i.id)) : items;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full bg-cream-100 p-1">
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
            Tout
          </FilterTab>
          <FilterTab active={filter === 'unread'} onClick={() => setFilter('unread')}>
            Poko li{unreadTotal > 0 ? ` (${unreadTotal})` : ''}
          </FilterTab>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={markAll}
            disabled={unreadTotal === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800 disabled:text-earth-400 disabled:cursor-not-allowed transition"
          >
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
            Make tout li
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white px-5 py-14 text-center">
          <Inbox className="w-10 h-10 mx-auto text-earth-400 mb-3" strokeWidth={1.6} />
          <p className="text-sm text-earth-600">
            {filter === 'unread'
              ? 'Ou li tout notifikasyon ou yo. 🎉'
              : 'Ou pa gen okenn notifikasyon.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((n) => {
            const unread = !readIds.has(n.id);
            const isHi = highlighted === n.id;
            return (
              <li key={n.id} id={`notif-${n.id}`}>
                <div
                  onClick={() => openItem(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openItem(n);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-forest-400 ${
                    isHi
                      ? 'bg-gold-50 border-gold-300 ring-2 ring-gold-300'
                      : unread
                        ? 'bg-forest-50/50 border-forest-200 hover:border-forest-300'
                        : 'bg-white border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      unread ? 'bg-forest-600' : 'bg-cream-300'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold text-ink">{n.title}</h2>
                      <span className="text-[11px] text-earth-500 shrink-0 whitespace-nowrap">
                        {n.when}
                      </span>
                    </div>
                    {n.message && (
                      <p className="text-sm text-earth-700 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4">
                      {n.link_url && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
                          Louvri <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (unread) markRead(n.id);
                          else markUnread(n.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-earth-500 hover:text-forest-700 transition"
                      >
                        {unread ? (
                          <>
                            <Check className="w-3 h-3" strokeWidth={2.4} /> Make li
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" strokeWidth={2.4} /> Make poko li
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
        active ? 'bg-white text-forest-700 shadow-sm' : 'text-earth-500 hover:text-earth-700'
      }`}
    >
      {children}
    </button>
  );
}
