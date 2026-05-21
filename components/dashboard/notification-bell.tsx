'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/dashboard/notifications/actions';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  created_at: string;
  target: 'all' | 'plan' | 'user';
  target_plan: 'basic' | 'premium' | 'vip' | null;
  target_user_id: string | null;
  created_by: string | null;
};

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'kounye a';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}è`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)}sm`;
  return TIME_FORMAT.format(new Date(iso));
}

export default function NotificationBell({
  userId,
  userPlan,
}: {
  userId: string;
  userPlan: 'basic' | 'premium' | 'vip';
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [marking, setMarking] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // ── Initial load ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [notifResult, readsResult] = await Promise.all([
        supabase
          .from('notifications')
          .select(
            'id, title, message, link_url, created_at, target, target_plan, target_user_id, created_by'
          )
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', userId),
      ]);
      if (cancelled) return;
      setNotifications(((notifResult.data ?? []) as Notification[]));
      setReadIds(
        new Set(
          ((readsResult.data ?? []) as { notification_id: string }[]).map(
            (r) => r.notification_id
          )
        )
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // ── Realtime subscription ────────────────────────────────────────────────
  React.useEffect(() => {
    const channel = supabase
      .channel(`notifications-bell-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const row = payload.new as Notification;
          // Filter to those visible to this user (mirroring RLS)
          const visible =
            row.target === 'all' ||
            (row.target === 'plan' && row.target_plan === userPlan) ||
            (row.target === 'user' && row.target_user_id === userId);
          if (!visible) return;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev;
            return [row, ...prev].slice(0, 30);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_reads',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { notification_id: string };
          setReadIds((prev) => {
            const next = new Set(prev);
            next.add(row.notification_id);
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, userPlan]);

  // ── Click-outside to close ───────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  async function onClickNotification(n: Notification) {
    if (!readIds.has(n.id)) {
      // optimistic
      setReadIds((prev) => new Set(prev).add(n.id));
      await markNotificationRead(n.id);
    }
    setOpen(false);
  }

  async function onMarkAll() {
    setMarking(true);
    const ids = notifications.map((n) => n.id);
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    await markAllNotificationsRead();
    setMarking(false);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        aria-label="Notifikasyon"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative grid place-items-center w-10 h-10 rounded-full border transition',
          unreadCount > 0
            ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/15'
            : 'bg-white border-cream-200 text-earth-700 hover:border-forest-300 hover:text-forest-700'
        )}
      >
        <Bell
          className={cn(
            'w-[18px] h-[18px]',
            unreadCount > 0 && 'animate-wiggle'
          )}
          strokeWidth={1.8}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-cream-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-cream-200 rounded-2xl shadow-2xl overflow-hidden z-40">
          <header className="px-4 py-3 border-b border-cream-200 flex items-center justify-between bg-cream-50/40">
            <div>
              <div className="font-display text-sm font-bold text-ink">
                Notifikasyon
              </div>
              <div className="text-[11px] text-earth-600">
                {unreadCount === 0
                  ? 'Tout li ✓'
                  : `${unreadCount} ki poko li`}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                disabled={marking}
                className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 disabled:opacity-60"
              >
                {marking ? (
                  <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
                ) : (
                  <CheckCheck className="w-3 h-3" strokeWidth={2.4} />
                )}
                Make tout li
              </button>
            )}
          </header>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-earth-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                Chaje…
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-earth-500">
                <BellOff
                  className="w-6 h-6 mx-auto mb-2 text-earth-400"
                  strokeWidth={1.6}
                />
                <div className="text-sm font-semibold text-ink">
                  Pa gen notifikasyon
                </div>
                <div className="text-[11px] mt-1">
                  Yo ap parèt isit lè admin pibliye yon bagay nouvo.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-cream-100">
                {notifications.map((n) => {
                  const unread = !readIds.has(n.id);
                  const Wrapper = n.link_url ? Link : 'div';
                  const wrapperProps = n.link_url
                    ? { href: n.link_url }
                    : { role: 'button' as const };
                  return (
                    <li key={n.id}>
                      <Wrapper
                        {...(wrapperProps as { href: string })}
                        onClick={() => onClickNotification(n)}
                        className={cn(
                          'block px-4 py-3 cursor-pointer transition',
                          unread
                            ? 'bg-accent/5 hover:bg-accent/10'
                            : 'hover:bg-cream-50'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {unread && (
                            <span
                              aria-hidden
                              className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                'text-sm leading-snug line-clamp-1',
                                unread
                                  ? 'font-bold text-ink'
                                  : 'font-semibold text-earth-700'
                              )}
                            >
                              {n.title}
                            </div>
                            <div
                              className={cn(
                                'text-xs mt-0.5 line-clamp-2 leading-relaxed',
                                unread ? 'text-earth-700' : 'text-earth-500'
                              )}
                            >
                              {n.message}
                            </div>
                            <div className="text-[10px] text-earth-500 mt-1 flex items-center gap-1.5">
                              <span>{relativeLabel(n.created_at)}</span>
                              {n.target === 'all' && (
                                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-600">
                                  Tout manm
                                </span>
                              )}
                              {n.target === 'plan' && n.target_plan && (
                                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                                  {n.target_plan}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
