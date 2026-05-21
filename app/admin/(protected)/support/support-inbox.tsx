'use client';

import React from 'react';
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  RefreshCw,
  MessageCircle,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  adminSendSupportReply,
  adminResolveThread,
  adminReopenThread,
} from './actions';
import type { Database } from '@/types/database';

type Thread = Database['public']['Tables']['support_threads']['Row'];
type Message = Database['public']['Tables']['support_messages']['Row'];
type ThreadWithUser = Thread & {
  user_email: string;
  user_full_name: string | null;
  last_message_body: string | null;
  last_message_role: string | null;
  last_message_at: string;
  unread_count: number;
};

type Props = {
  initialThreads: ThreadWithUser[];
};

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

function formatTime(iso: string) {
  return TIME_FORMAT.format(new Date(iso));
}

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'kounye a';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} è`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} jou`;
  return `${Math.floor(days / 7)} sem`;
}

export default function SupportInbox({ initialThreads }: Props) {
  const supabase = React.useMemo(() => createClient(), []);
  const [threads, setThreads] = React.useState<ThreadWithUser[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    initialThreads[0]?.id ?? null
  );
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'open' | 'all'>('open');
  const [search, setSearch] = React.useState('');
  const messageIds = React.useRef(new Set<string>());
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  // ── Realtime: any new support_message — refresh both panes ────────────────
  React.useEffect(() => {
    const channel = supabase
      .channel('admin-support-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        (payload) => {
          const row = payload.new as Message;

          // Update thread list (bump preview + last_message_at)
          setThreads((prev) => {
            const next = prev.map((t) => {
              if (t.id !== row.thread_id) return t;
              return {
                ...t,
                last_message_body: row.body,
                last_message_role: row.sender_role,
                last_message_at: row.created_at,
                unread_count:
                  row.sender_role === 'user'
                    ? t.unread_count + (row.thread_id === activeThreadId ? 0 : 1)
                    : t.unread_count,
              };
            });
            // Re-sort by last_message_at desc
            next.sort(
              (a, b) =>
                new Date(b.last_message_at).getTime() -
                new Date(a.last_message_at).getTime()
            );
            return next;
          });

          // Update visible messages if this thread is selected
          if (row.thread_id === activeThreadId) {
            if (messageIds.current.has(row.id)) return;
            messageIds.current.add(row.id);
            setMessages((prev) => [...prev, row]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_threads',
        },
        (payload) => {
          const row = payload.new as Thread;
          setThreads((prev) =>
            prev.map((t) =>
              t.id === row.id
                ? { ...t, status: row.status, updated_at: row.updated_at }
                : t
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_threads',
        },
        async (payload) => {
          const row = payload.new as Thread;
          // Fetch user profile for the new thread
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', row.user_id)
            .maybeSingle();
          const p = profile as { email: string; full_name: string | null } | null;
          setThreads((prev) => {
            if (prev.some((t) => t.id === row.id)) return prev;
            const newRow: ThreadWithUser = {
              ...row,
              user_email: p?.email ?? '',
              user_full_name: p?.full_name ?? null,
              last_message_body: null,
              last_message_role: null,
              last_message_at: row.last_message_at,
              unread_count: 0,
            };
            return [newRow, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, activeThreadId]);

  // ── Load messages when activeThreadId changes ─────────────────────────────
  React.useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    setError(null);
    messageIds.current.clear();
    (async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setMessages([]);
      } else {
        const list = (data ?? []) as Message[];
        list.forEach((m) => messageIds.current.add(m.id));
        setMessages(list);
      }
      setLoadingMessages(false);
      // Reset unread badge on the active thread
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId ? { ...t, unread_count: 0 } : t
        )
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, activeThreadId]);

  // ── Auto-scroll to bottom on new messages ─────────────────────────────────
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!activeThreadId) return;
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setDraft('');

    // Optimistic
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      thread_id: activeThreadId,
      sender_role: 'agent',
      sender_id: null,
      body: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await adminSendSupportReply(activeThreadId, text);
    if (!res.ok) {
      setError(res.error);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setSending(false);
      return;
    }

    messageIds.current.add(res.message.id);
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? res.message : m))
    );
    setSending(false);
  }

  async function onToggleResolved() {
    if (!activeThread) return;
    setError(null);
    const fn =
      activeThread.status === 'open' ? adminResolveThread : adminReopenThread;
    const res = await fn(activeThread.id);
    if (!res.ok) setError(res.error);
  }

  const visibleThreads = threads.filter((t) => {
    if (statusFilter === 'open' && t.status !== 'open') return false;
    if (search) {
      const q = search.toLowerCase();
      const blob = `${t.user_full_name ?? ''} ${t.user_email} ${
        t.last_message_body ?? ''
      } ${t.subject ?? ''}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  const totalUnread = threads.reduce((s, t) => s + (t.unread_count ?? 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden h-[calc(100vh-180px)] min-h-[560px]">
      {/* ── Left pane — thread list ──────────────────────────────────────── */}
      <aside className="border-r border-cream-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-cream-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent/10 text-accent">
                <Inbox className="w-3.5 h-3.5" strokeWidth={2.2} />
              </span>
              <h2 className="font-display text-sm font-bold text-ink">
                Bwat antre
              </h2>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setStatusFilter('open')}
                className={cn(
                  'px-2 py-0.5 rounded-full font-semibold transition',
                  statusFilter === 'open'
                    ? 'bg-forest-700 text-cream-50'
                    : 'text-earth-600 hover:text-ink'
                )}
              >
                Ouvè
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-2 py-0.5 rounded-full font-semibold transition',
                  statusFilter === 'all'
                    ? 'bg-forest-700 text-cream-50'
                    : 'text-earth-600 hover:text-ink'
                )}
              >
                Tout
              </button>
            </div>
          </div>
          <label className="relative block">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-earth-500"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chèche pa non oswa mesaj…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-cream-50 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300"
            />
          </label>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-cream-100">
          {visibleThreads.length === 0 ? (
            <li className="p-8 text-center text-xs text-earth-500 italic">
              Pa gen konvèsasyon ki matche.
            </li>
          ) : (
            visibleThreads.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActiveThreadId(t.id)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-cream-50/80 transition',
                    activeThreadId === t.id && 'bg-forest-50 hover:bg-forest-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="grid place-items-center w-8 h-8 rounded-full bg-forest-100 text-forest-700 font-display text-xs font-bold shrink-0">
                      {(t.user_full_name?.[0] ?? t.user_email[0] ?? 'M').toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">
                        {t.user_full_name || t.user_email.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-earth-500 truncate">
                        {t.user_email}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-earth-500">
                        {relativeLabel(t.last_message_at)}
                      </span>
                      {t.unread_count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-600 text-white">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-earth-700 line-clamp-2 leading-snug mt-1 pl-10">
                    {t.last_message_role === 'agent' ? (
                      <span className="text-earth-500 italic">Ou: </span>
                    ) : null}
                    {t.last_message_body ?? <em className="italic">Pa gen mesaj ankò.</em>}
                  </div>
                  {t.status !== 'open' && (
                    <span className="ml-10 mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-cream-100 text-earth-600">
                      <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.4} />
                      Rezoud
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* ── Right pane — selected conversation ───────────────────────────── */}
      <section className="flex flex-col min-h-0 bg-cream-50/30">
        {activeThread ? (
          <>
            <header className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-cream-200 bg-white">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-700 font-display font-bold text-sm shrink-0">
                {(activeThread.user_full_name?.[0] ?? activeThread.user_email[0] ?? 'M').toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink truncate">
                  {activeThread.user_full_name || activeThread.user_email.split('@')[0]}
                </div>
                <div className="text-[11px] text-earth-600 truncate">
                  {activeThread.user_email}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleResolved}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition',
                  activeThread.status === 'open'
                    ? 'border-cream-200 text-earth-700 hover:border-forest-300 hover:text-forest-700'
                    : 'border-forest-200 bg-forest-50 text-forest-700 hover:bg-forest-100'
                )}
              >
                {activeThread.status === 'open' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Make rezoud
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Reouvri
                  </>
                )}
              </button>
            </header>

            <div
              ref={bodyRef}
              className="flex-1 overflow-y-auto px-4 md:px-5 py-5 space-y-3 bg-[radial-gradient(circle_at_1px_1px,rgba(122,175,82,0.05)_1px,transparent_0)] bg-[length:22px_22px]"
            >
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full text-earth-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                  Chaje mesaj yo…
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-earth-500 italic mt-10">
                  Pa gen mesaj nan konvèsasyon sa.
                </div>
              ) : (
                messages.map((m) => <Bubble key={m.id} message={m} />)
              )}
            </div>

            <form
              onSubmit={onSend}
              className="px-3 md:px-4 py-3 border-t border-cream-200 bg-white flex items-end gap-2"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                rows={1}
                placeholder="Ekri repons ou kòm Mèt Joseph…"
                disabled={sending || activeThread.status !== 'open'}
                className="flex-1 resize-none px-4 py-2.5 text-sm bg-cream-50 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 leading-relaxed max-h-32 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending || activeThread.status !== 'open'}
                aria-label="Voye"
                className="grid place-items-center w-10 h-10 rounded-full bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 transition shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                ) : (
                  <Send className="w-4 h-4" strokeWidth={2.2} />
                )}
              </button>
            </form>

            {error && (
              <div className="px-5 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-200 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-earth-500">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-cream-100 mb-3 text-earth-500">
              <MessageCircle className="w-6 h-6" strokeWidth={1.8} />
            </span>
            <div className="font-display text-base font-bold text-ink">
              Chwazi yon konvèsasyon
            </div>
            <p className="text-xs text-earth-600 mt-1 max-w-xs">
              Klike sou yon liy sou bò goch pou wè mesaj yo epi reponn.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  const isAgent = message.sender_role === 'agent' || message.sender_role === 'system';
  return (
    <div className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm',
          isAgent
            ? 'bg-forest-700 text-cream-50 rounded-br-md'
            : 'bg-white border border-cream-200 text-ink rounded-bl-md'
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.body}</div>
        <div
          className={cn(
            'text-[10px] mt-1 text-right',
            isAgent ? 'text-cream-200/80' : 'text-earth-500'
          )}
        >
          {formatTime(message.created_at)}
          {message.sender_role === 'system' && (
            <span className="ml-1 italic">· auto</span>
          )}
        </div>
      </div>
    </div>
  );
}
