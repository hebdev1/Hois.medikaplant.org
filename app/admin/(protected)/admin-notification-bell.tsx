'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  CheckCheck,
  Loader2,
  UserPlus,
  GraduationCap,
  CreditCard,
  MessageCircle,
  MessagesSquare,
  HelpCircle,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from './notification-actions';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Admin event bell.
//
// The DB triggers (tg_notify_admins_*) already write one notifications row per
// admin for every member action — new signup, course purchase, plan
// subscription, support message, forum topic/reply, course question, contact
// message — as target='user', target_user_id=<that admin>. The old bell ignored
// all of that and only live-counted contact_messages(new) + support_threads
// (open). This one reads the actual feed, so EVERY member action shows up (and
// stays in sync with the pushes the same rows fire).
//
// Modeled on the member NotificationBell, scoped to this admin's own rows, with
// a per-action-type icon derived from the trigger's title.
// ─────────────────────────────────────────────────────────────────────────────

type AdminNotif = {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  created_at: string;
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

// Icon + tint per action, matched on the Kreyòl title the triggers set. Keyword
// order matters: check the more specific words before the generic ones (e.g.
// "kesyon" and "acha kou" both contain "kou").
function kindOf(title: string): {
  Icon: typeof Bell;
  bg: string;
} {
  const t = title.toLowerCase();
  if (t.includes('kontak')) return { Icon: Inbox, bg: 'bg-rose-500/10 text-rose-600' };
  if (t.includes('kesyon')) return { Icon: HelpCircle, bg: 'bg-indigo-500/10 text-indigo-600' };
  if (t.includes('sipò')) return { Icon: MessageCircle, bg: 'bg-violet-500/10 text-violet-600' };
  if (t.includes('fowòm')) return { Icon: MessagesSquare, bg: 'bg-sky-500/10 text-sky-600' };
  if (t.includes('abònman')) return { Icon: CreditCard, bg: 'bg-amber-500/10 text-amber-700' };
  if (t.includes('acha') || t.includes('kou')) return { Icon: GraduationCap, bg: 'bg-emerald-500/10 text-emerald-600' };
  if (t.includes('enskripsyon') || t.includes('manm')) return { Icon: UserPlus, bg: 'bg-forest-500/10 text-forest-700' };
  return { Icon: Sparkles, bg: 'bg-slate-500/10 text-slate-600' };
}

export default function AdminNotificationBell({
  adminId,
}: {
  adminId: string;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AdminNotif[]>([]);
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [marking, setMarking] = React.useState(false);
  const [toast, setToast] = React.useState<AdminNotif | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // ── Initial load ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [notifResult, readsResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('id, title, message, link_url, created_at')
          // Only THIS admin's event feed. RLS lets an admin read every row, so
          // without this filter the bell would show every member's personal
          // notifications too.
          .eq('target', 'user')
          .eq('target_user_id', adminId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', adminId),
      ]);
      if (cancelled) return;
      setNotifications((notifResult.data ?? []) as AdminNotif[]);
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
  }, [supabase, adminId]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const channel = supabase
      .channel(`admin-bell-${adminId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `target_user_id=eq.${adminId}`,
        },
        (payload) => {
          const row = payload.new as AdminNotif;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev;
            return [row, ...prev].slice(0, 40);
          });
          setToast(row);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 6000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_reads',
          filter: `user_id=eq.${adminId}`,
        },
        (payload) => {
          const row = payload.new as { notification_id: string };
          setReadIds((prev) => new Set(prev).add(row.notification_id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, adminId]);

  // ── Click-outside ─────────────────────────────────────────────────────────
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
  const hasUnread = unreadCount > 0;

  async function onClickNotification(n: AdminNotif) {
    if (!readIds.has(n.id)) {
      setReadIds((prev) => new Set(prev).add(n.id));
      await markAdminNotificationRead(n.id);
    }
    setOpen(false);
  }

  async function onMarkAll() {
    setMarking(true);
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
    await markAllAdminNotificationsRead();
    setMarking(false);
  }

  return (
    // translate="no": this subtree mutates on realtime pushes; letting Google
    // Translate wrap text nodes in <font> tags makes React's next insertBefore
    // throw. (Admin panel is Kreyòl-only anyway.)
    <div ref={dropdownRef} className="notranslate relative" translate="no">
      <button
        type="button"
        aria-label="Notifikasyon admin"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative grid place-items-center w-10 h-10 rounded-full border transition-all duration-200',
          hasUnread
            ? 'bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-cream-50 border-rose-400/40 text-rose-600 shadow-[0_0_0_3px_rgba(244,63,94,0.12)] hover:shadow-[0_0_0_4px_rgba(244,63,94,0.18)]'
            : 'bg-white border-cream-200 text-earth-700 hover:border-forest-300 hover:text-forest-700 hover:shadow-sm'
        )}
      >
        {hasUnread && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-rose-500/15 animate-pulseGold"
            style={{ animationDuration: '2.6s' }}
          />
        )}
        <Bell
          className={cn(
            'w-[18px] h-[18px] relative z-10',
            hasUnread && 'animate-wiggle drop-shadow'
          )}
          strokeWidth={hasUnread ? 2.2 : 1.8}
        />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-cream-50 shadow-md tracking-tight z-20">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-cream-200 rounded-2xl shadow-2xl overflow-hidden z-40 animate-fadeIn">
          <header className="relative px-4 py-3 border-b border-cream-200 bg-gradient-to-br from-rose-500/10 via-cream-50 to-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow">
                  <Bell className="w-3.5 h-3.5" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="font-display text-sm font-bold text-ink leading-tight">
                    Aktivite manm yo
                  </div>
                  <div
                    className={cn(
                      'text-[11px] font-medium',
                      hasUnread ? 'text-rose-600' : 'text-earth-600'
                    )}
                  >
                    {hasUnread ? `${unreadCount} nouvo aksyon` : 'Tout li ✓'}
                  </div>
                </div>
              </div>
              {hasUnread && (
                <button
                  type="button"
                  onClick={onMarkAll}
                  disabled={marking}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-forest-700 bg-white hover:bg-forest-50 border border-cream-200 hover:border-forest-300 disabled:opacity-60 transition shadow-sm"
                >
                  {marking ? (
                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
                  ) : (
                    <CheckCheck className="w-3 h-3" strokeWidth={2.4} />
                  )}
                  Make tout li
                </button>
              )}
            </div>
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
                  Pa gen aktivite pou kounye a
                </div>
                <div className="text-[11px] mt-1">
                  Lè yon manm enskri, achte, oswa ekri, l ap parèt isit la.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-cream-100">
                {notifications.map((n) => {
                  const unread = !readIds.has(n.id);
                  const { Icon, bg } = kindOf(n.title);
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
                          'block px-4 py-3 cursor-pointer transition relative',
                          unread
                            ? 'bg-gradient-to-r from-rose-500/[0.06] to-transparent hover:from-rose-500/[0.10]'
                            : 'hover:bg-cream-50'
                        )}
                      >
                        {unread && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-rose-500 to-rose-700"
                          />
                        )}
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'grid place-items-center w-9 h-9 rounded-xl shrink-0',
                              bg
                            )}
                          >
                            <Icon className="w-4 h-4" strokeWidth={2.1} />
                          </span>
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
                            <div className="text-[10px] text-earth-500 mt-1.5 font-medium">
                              {relativeLabel(n.created_at)} pase
                            </div>
                          </div>
                          {unread && (
                            <span
                              aria-hidden
                              className="mt-1.5 w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
                            />
                          )}
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-cream-200 px-4 py-3 text-center text-xs font-semibold text-forest-700 hover:bg-cream-50 transition"
          >
            Wè tout nan istorik la
          </Link>
        </div>
      )}

      {toast && (
        <button
          type="button"
          onClick={() => {
            const t = toast;
            setToast(null);
            if (!t) return;
            if (!readIds.has(t.id)) {
              setReadIds((p) => new Set(p).add(t.id));
              markAdminNotificationRead(t.id);
            }
            if (t.link_url) window.location.href = t.link_url;
          }}
          className="fixed bottom-4 right-4 z-[80] w-[320px] max-w-[calc(100vw-2rem)] text-left rounded-2xl border border-cream-200 bg-white shadow-2xl p-3.5 flex items-start gap-2.5 animate-fadeIn"
        >
          <span
            className={cn(
              'grid place-items-center w-8 h-8 rounded-xl shrink-0',
              kindOf(toast.title).bg
            )}
          >
            {React.createElement(kindOf(toast.title).Icon, {
              className: 'w-4 h-4',
              strokeWidth: 2.2,
            })}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink truncate">
              {toast.title}
            </span>
            <span className="block text-xs text-earth-600 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.message}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
