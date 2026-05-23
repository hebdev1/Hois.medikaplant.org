'use client';

import React from 'react';
import {
  Send,
  Loader2,
  AlertCircle,
  Trash2,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { createReply, deleteReply } from '../actions';
import type { Database } from '@/types/database';

type Reply = Database['public']['Tables']['forum_replies']['Row'];

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: 'user' | 'admin';
};

type Props = {
  topicId: string;
  topicLocked: boolean;
  currentUserId: string;
  isAdmin: boolean;
  initialReplies: Reply[];
  authorById: Record<string, Profile | undefined>;
};

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});
const MOIS = [
  'Janvye', 'Fevriye', 'Mas', 'Avril', 'Me', 'Jen',
  'Jiyè', 'Out', 'Septanm', 'Oktòb', 'Novanm', 'Desanm',
];
function formatReplyDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MOIS[d.getMonth()]} · ${TIME_FORMAT.format(d)}`;
}

export default function RepliesList({
  topicId,
  topicLocked,
  currentUserId,
  isAdmin,
  initialReplies,
  authorById: initialAuthorById,
}: Props) {
  const supabase = React.useMemo(() => createClient(), []);
  const [replies, setReplies] = React.useState<Reply[]>(initialReplies);
  const [authorById, setAuthorById] =
    React.useState<Record<string, Profile | undefined>>(initialAuthorById);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const seenIds = React.useRef(new Set(initialReplies.map((r) => r.id)));

  // ── Realtime: pick up new replies and inserts from other tabs/devices ──
  React.useEffect(() => {
    const channel = supabase
      .channel(`forum-topic-${topicId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_replies',
          filter: `topic_id=eq.${topicId}`,
        },
        async (payload) => {
          const row = payload.new as Reply;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          // Fetch the author profile if we don't have it cached
          if (!authorById[row.user_id]) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('id, full_name, email, role')
              .eq('id', row.user_id)
              .maybeSingle();
            if (prof) {
              setAuthorById((m) => ({
                ...m,
                [row.user_id]: prof as Profile,
              }));
            }
          }
          setReplies((prev) => [...prev, row]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'forum_replies',
          filter: `topic_id=eq.${topicId}`,
        },
        (payload) => {
          const old = payload.old as { id: string };
          seenIds.current.delete(old.id);
          setReplies((prev) => prev.filter((r) => r.id !== old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, topicId, authorById]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending || topicLocked) return;

    setSending(true);
    setError(null);

    const res = await createReply(topicId, text);
    setSending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    // Optimistically display (realtime echo will dedup via seenIds)
    seenIds.current.add(res.reply.id);
    setReplies((prev) => [...prev, res.reply]);
    setDraft('');
  }

  async function onDelete(id: string) {
    if (!window.confirm('Èske w sèten ou vle efase repons sa?')) return;
    const res = await deleteReply(id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // Realtime DELETE event removes from list
  }

  return (
    <div className="space-y-5">
      {/* Replies count strip */}
      <div className="text-xs text-earth-600 flex items-center gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-100 text-earth-700 border border-cream-200">
          {replies.length} repons
        </span>
        {topicLocked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
            <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
            Sijè a fèmen
          </span>
        )}
      </div>

      {/* Replies */}
      {replies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-200 bg-cream-50/40 px-4 py-8 text-center text-sm text-earth-600">
          Poko gen repons. Ekri premye a!
        </div>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => {
            const author = authorById[r.user_id];
            const canDelete = isAdmin || r.user_id === currentUserId;
            const isMe = r.user_id === currentUserId;
            const authorName =
              author?.full_name ||
              author?.email?.split('@')[0] ||
              'Manm';
            const initials = (
              author?.full_name?.[0] ??
              author?.email?.[0] ??
              'M'
            ).toUpperCase();

            return (
              <li
                key={r.id}
                className={cn(
                  'rounded-2xl border bg-white p-4 shadow-sm',
                  isMe
                    ? 'border-forest-200 bg-gradient-to-br from-forest-50/60 to-white'
                    : 'border-cream-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'grid place-items-center w-10 h-10 rounded-full font-display font-bold text-sm shrink-0',
                      isMe
                        ? 'bg-forest-700 text-cream-50'
                        : 'bg-cream-100 text-earth-700'
                    )}
                  >
                    {initials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-ink truncate">
                        {authorName}
                      </span>
                      {author?.role === 'admin' && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          <ShieldAlert className="w-2.5 h-2.5" strokeWidth={2.4} />
                          Admin
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700">
                          Ou menm
                        </span>
                      )}
                      <span className="text-[10px] text-earth-500">
                        {formatReplyDate(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink/90 whitespace-pre-wrap break-words leading-relaxed">
                      {r.body}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      aria-label="Efase repons"
                      className="grid place-items-center w-7 h-7 rounded-lg text-earth-500 hover:text-rose-700 hover:bg-rose-50 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Composer */}
      {topicLocked ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          Sijè sa fèmen. Pa ka gen nouvo repons.
        </div>
      ) : (
        <form
          onSubmit={onSend}
          className="bg-white border border-cream-200 rounded-2xl p-3 md:p-4 shadow-card flex items-end gap-2"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={2}
            placeholder="Ekri repons ou… (Ctrl+Enter pou voye)"
            disabled={sending}
            className="flex-1 resize-none px-4 py-2.5 text-sm bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 leading-relaxed max-h-40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Voye repons"
            className="grid place-items-center w-11 h-11 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 transition shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2.2} />
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
          {error}
        </div>
      )}
    </div>
  );
}
