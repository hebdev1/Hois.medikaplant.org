'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, BellOff, Loader2, Inbox, CalendarClock, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Counts = {
  contact: number;
  consultations: number;
  support: number;
};

/**
 * Real-time bell for the admin chrome. Aggregates three signals an admin
 * almost always needs to react to:
 *   1. New contact-form messages (status='new')
 *   2. New consultation requests (status='requested')
 *   3. Open support threads (status='open')
 *
 * Strategy: do three small COUNT-only fetches up front, then subscribe to
 * INSERT/UPDATE events on the three source tables via Supabase Realtime.
 * On every change we refetch the affected counter (cheap, server-side
 * count, no row payload). This avoids maintaining a separate admin-events
 * table and keeps the bell honest — what the admin sees is always the
 * live truth.
 *
 * Capability gating happens server-side: the layout only renders the bell
 * with the channels the current admin can act on, so we don't bother
 * showing a category they cannot reach.
 */
export type AdminBellChannel = 'contact' | 'consultations' | 'support';

export default function AdminNotificationBell({
  channels,
}: {
  channels: AdminBellChannel[];
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [counts, setCounts] = React.useState<Counts>({
    contact: 0,
    consultations: 0,
    support: 0,
  });
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Stable Set of allowed channels for cheap membership checks below.
  const allowed = React.useMemo(() => new Set(channels), [channels]);

  // ── Counter fetchers ──────────────────────────────────────────────────────
  const fetchContact = React.useCallback(async () => {
    if (!allowed.has('contact')) return;
    const { count } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new');
    setCounts((prev) => ({ ...prev, contact: count ?? 0 }));
  }, [supabase, allowed]);

  const fetchConsults = React.useCallback(async () => {
    if (!allowed.has('consultations')) return;
    const { count } = await supabase
      .from('consultations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested');
    setCounts((prev) => ({ ...prev, consultations: count ?? 0 }));
  }, [supabase, allowed]);

  const fetchSupport = React.useCallback(async () => {
    if (!allowed.has('support')) return;
    const { count } = await supabase
      .from('support_threads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');
    setCounts((prev) => ({ ...prev, support: count ?? 0 }));
  }, [supabase, allowed]);

  // ── Initial load + reactive refresh whenever channel set changes ─────────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([fetchContact(), fetchConsults(), fetchSupport()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchContact, fetchConsults, fetchSupport]);

  // ── Realtime subscriptions ────────────────────────────────────────────────
  React.useEffect(() => {
    const channel = supabase.channel('admin-bell');

    if (allowed.has('contact')) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_messages' },
        () => {
          fetchContact();
        }
      );
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contact_messages' },
        () => {
          // Status flips (new → responded → archived) all change the count.
          fetchContact();
        }
      );
    }
    if (allowed.has('consultations')) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consultations' },
        () => {
          fetchConsults();
        }
      );
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultations' },
        () => {
          fetchConsults();
        }
      );
    }
    if (allowed.has('support')) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_threads' },
        () => {
          fetchSupport();
        }
      );
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_threads' },
        () => {
          fetchSupport();
        }
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, allowed, fetchContact, fetchConsults, fetchSupport]);

  // ── Click-outside to close ────────────────────────────────────────────────
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

  // Refresh-on-focus so admins coming back from another tab see the latest
  // numbers without waiting for the next realtime event.
  React.useEffect(() => {
    function onFocus() {
      fetchContact();
      fetchConsults();
      fetchSupport();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchContact, fetchConsults, fetchSupport]);

  const total = counts.contact + counts.consultations + counts.support;
  const hasUnread = total > 0;

  return (
    <div ref={dropdownRef} className="relative">
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
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-cream-50 shadow-md tracking-tight z-20"
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-cream-200 rounded-2xl shadow-2xl overflow-hidden z-40 animate-fadeIn">
          <header className="relative px-4 py-3 border-b border-cream-200 bg-gradient-to-br from-rose-500/10 via-cream-50 to-white">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow">
                <Bell className="w-3.5 h-3.5" strokeWidth={2.2} />
              </span>
              <div>
                <div className="font-display text-sm font-bold text-ink leading-tight">
                  Sa kap rive
                </div>
                <div
                  className={cn(
                    'text-[11px] font-medium',
                    hasUnread ? 'text-rose-600' : 'text-earth-600'
                  )}
                >
                  {hasUnread
                    ? `${total} aksyon kap tann ou`
                    : 'Tout aksyon yo trete ✓'}
                </div>
              </div>
            </div>
          </header>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-earth-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                Chaje…
              </div>
            ) : !hasUnread ? (
              <div className="p-10 text-center text-earth-500">
                <BellOff
                  className="w-6 h-6 mx-auto mb-2 text-earth-400"
                  strokeWidth={1.6}
                />
                <div className="text-sm font-semibold text-ink">
                  Pa gen aksyon kap tann
                </div>
                <div className="text-[11px] mt-1">
                  Lè yon manm voye yon mesaj oswa mande yon konsiltasyon,
                  l ap parèt isit la.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-cream-100">
                {allowed.has('contact') && counts.contact > 0 && (
                  <BellRow
                    icon={<Inbox className="w-4 h-4" strokeWidth={2.2} />}
                    title="Nouvo mesaj kontak"
                    body={`${counts.contact} mesaj ki tann repons.`}
                    href="/admin/contact?tab=new"
                    count={counts.contact}
                    tone="rose"
                    onClick={() => setOpen(false)}
                  />
                )}
                {allowed.has('consultations') && counts.consultations > 0 && (
                  <BellRow
                    icon={
                      <CalendarClock className="w-4 h-4" strokeWidth={2.2} />
                    }
                    title="Konsiltasyon mande"
                    body={`${counts.consultations} demann ki bezwen pwograme.`}
                    href="/admin/consultations"
                    count={counts.consultations}
                    tone="amber"
                    onClick={() => setOpen(false)}
                  />
                )}
                {allowed.has('support') && counts.support > 0 && (
                  <BellRow
                    icon={
                      <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
                    }
                    title="Sipò chat ouvè"
                    body={`${counts.support} konvèsasyon poko fèmen.`}
                    href="/admin/support"
                    count={counts.support}
                    tone="violet"
                    onClick={() => setOpen(false)}
                  />
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellRow({
  icon,
  title,
  body,
  href,
  count,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  count: number;
  tone: 'rose' | 'amber' | 'violet';
  onClick: () => void;
}) {
  const toneStyles: Record<typeof tone, string> = {
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
    violet: 'bg-violet-100 text-violet-700',
  } as const;
  const iconBg: Record<typeof tone, string> = {
    rose: 'bg-rose-500/10 text-rose-600',
    amber: 'bg-amber-500/10 text-amber-700',
    violet: 'bg-violet-500/10 text-violet-700',
  } as const;
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="block px-4 py-3 hover:bg-cream-50 transition group"
      >
        <div className="flex items-center gap-3">
          <span
            className={`grid place-items-center w-9 h-9 rounded-xl ${iconBg[tone]}`}
          >
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-ink text-sm leading-tight">
              {title}
            </div>
            <div className="text-[11px] text-earth-600 mt-0.5">{body}</div>
          </div>
          <span
            className={`text-[11px] font-extrabold uppercase tracking-tight px-2 py-0.5 rounded-full ${toneStyles[tone]}`}
          >
            {count > 99 ? '99+' : count}
          </span>
        </div>
      </Link>
    </li>
  );
}
