'use client';

import React from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  getMemberThread,
  getOrCreateThread,
  sendMessage as sendMemberMessage,
  markThreadRead,
} from '@/app/dashboard/support/actions';
import { submitSuggestion } from '@/app/dashboard/actions';

// ── Types kept minimal; the server actions own the source shapes ────────────
type Msg = {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
};
type Thread = { id: string; member_last_read_at: string | null };

type Tab = 'mesaj' | 'sijesyon';

// Unread = agent (real admin) messages newer than the member's read marker.
function countUnread(thread: Thread | null, messages: Msg[]): number {
  if (!thread) return 0;
  const since = thread.member_last_read_at
    ? new Date(thread.member_last_read_at).getTime()
    : 0;
  return messages.filter(
    (m) => m.sender_role === 'agent' && new Date(m.created_at).getTime() > since
  ).length;
}

const SUGGESTION_CATEGORIES: { value: string; label: string }[] = [
  { value: 'general', label: 'Jeneral' },
  { value: 'feature', label: 'Nouvo lide' },
  { value: 'bug', label: 'Bug' },
  { value: 'content', label: 'Kontni' },
  { value: 'other', label: 'Lòt' },
];

export default function MessageBox() {
  const supabase = React.useMemo(() => createClient(), []);
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>('mesaj');

  const [thread, setThread] = React.useState<Thread | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const unread = countUnread(thread, messages);

  // On mount: read-only fetch so the badge can show without creating a thread.
  React.useEffect(() => {
    let alive = true;
    getMemberThread().then((res) => {
      if (!alive || !res.ok || !res.data) return;
      setThread(res.data.thread as Thread);
      setMessages(res.data.messages as Msg[]);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Realtime: new messages in the current thread appear live.
  React.useEffect(() => {
    if (!thread) return;
    const channel = supabase
      .channel(`msgbox-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, thread]);

  React.useEffect(() => {
    if (open && tab === 'mesaj') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, tab]);

  // Opening the Mesaj tab: ensure a thread exists, load it, and clear unread.
  async function openMesaj() {
    setTab('mesaj');
    if (!thread) {
      setLoading(true);
      const res = await getOrCreateThread();
      setLoading(false);
      if (res.ok) {
        setThread(res.data.thread as Thread);
        setMessages(res.data.messages as Msg[]);
      }
    }
    const id = thread?.id;
    if (id) {
      await markThreadRead(id);
      setThread((t) => (t ? { ...t, member_last_read_at: new Date().toISOString() } : t));
    }
  }

  async function onOpen() {
    setOpen(true);
    if (tab === 'mesaj') await openMesaj();
  }

  async function send() {
    const text = draft.trim();
    if (!text || !thread || sending) return;
    setSending(true);
    const res = await sendMemberMessage(thread.id, text);
    setSending(false);
    if (res.ok) {
      setDraft('');
      setMessages((prev) =>
        prev.some((x) => x.id === res.message.id) ? prev : [...prev, res.message as Msg]
      );
    }
  }

  return (
    <>
      {/* Floating trigger — sits where the suggestion button used to. */}
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Mesaj"
          className="notranslate fixed bottom-28 right-4 sm:bottom-32 sm:right-6 z-[99] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-cream-50 shadow-lg border border-forest-600 transition"
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
          <span className="text-sm font-semibold">Mesaj</span>
          {unread > 0 && (
            <span className="grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="notranslate fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[101] w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white shadow-2xl border border-cream-200 overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header + tabs */}
          <div className="bg-forest-800 text-cream-50 px-4 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold">Hoïs</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fèmen">
                <X className="w-4 h-4" strokeWidth={2.4} />
              </button>
            </div>
            <div className="flex gap-1 mt-2 -mb-px">
              <TabButton active={tab === 'mesaj'} onClick={openMesaj}>
                <MessageCircle className="w-3.5 h-3.5" /> Mesaj
                {unread > 0 && (
                  <span className="ml-1 grid place-items-center min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unread}
                  </span>
                )}
              </TabButton>
              <TabButton active={tab === 'sijesyon'} onClick={() => setTab('sijesyon')}>
                <Lightbulb className="w-3.5 h-3.5" /> Sijesyon
              </TabButton>
            </div>
          </div>

          {tab === 'mesaj' ? (
            <MesajTab
              loading={loading}
              messages={messages}
              draft={draft}
              setDraft={setDraft}
              sending={sending}
              send={send}
              bottomRef={bottomRef}
            />
          ) : (
            <SijesyonTab />
          )}
        </div>
      )}
    </>
  );
}

function TabButton({
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
      className={cn(
        'inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-t-lg transition',
        active ? 'bg-white text-forest-900' : 'text-cream-100/80 hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

function MesajTab({
  loading,
  messages,
  draft,
  setDraft,
  sending,
  send,
  bottomRef,
}: {
  loading: boolean;
  messages: Msg[];
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  send: () => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-cream-50/60 min-h-[220px]">
        {loading && messages.length === 0 ? (
          <div className="grid place-items-center h-full text-earth-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-earth-500 text-sm mt-8 px-4">
            Ekri yon mesaj — ekip Hoïs ap reponn ou.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === 'user';
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                    mine
                      ? 'bg-forest-700 text-cream-50 rounded-br-sm'
                      : 'bg-white border border-cream-200 text-ink rounded-bl-sm'
                  )}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-2.5 border-t border-cream-200 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Ekri yon mesaj…"
          className="flex-1 resize-none max-h-24 px-3 py-2 text-sm rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-forest-200"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !draft.trim()}
          className="grid place-items-center w-9 h-9 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-40 text-cream-50 shrink-0"
          aria-label="Voye"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" strokeWidth={2.2} />
          )}
        </button>
      </div>
    </>
  );
}

function SijesyonTab() {
  const [category, setCategory] = React.useState('general');
  const [message, setMessage] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 3) {
      setError('Ekri yon ti kras plis.');
      return;
    }
    setPending(true);
    setError(null);
    const res = await submitSuggestion({
      category,
      message: text,
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : null,
    });
    setPending(false);
    if (res.ok) {
      setDone(true);
      setMessage('');
    } else {
      setError(res.error);
    }
  }

  if (done) {
    return (
      <div className="p-6 text-center min-h-[220px] grid place-items-center">
        <div>
          <CheckCircle2 className="w-8 h-8 text-forest-600 mx-auto mb-2" strokeWidth={2} />
          <p className="text-sm font-semibold text-ink">Mèsi pou sijesyon w lan!</p>
          <button
            type="button"
            onClick={() => setDone(false)}
            className="mt-3 text-xs font-semibold text-forest-700 hover:text-forest-900"
          >
            Voye yon lòt
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="p-3 space-y-3 min-h-[220px]">
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTION_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-full border transition',
              category === c.value
                ? 'bg-forest-700 text-cream-50 border-forest-700'
                : 'bg-white text-earth-600 border-cream-200 hover:border-forest-300'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Pataje yon lide oswa yon obsèvasyon…"
        className="w-full resize-none px-3 py-2 text-sm rounded-xl border border-cream-200 focus:outline-none focus:ring-2 focus:ring-forest-200"
      />
      {error && (
        <p className="text-xs text-rose-700 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 rounded-xl"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Voye sijesyon an
      </button>
    </form>
  );
}
