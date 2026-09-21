'use client';

import React from 'react';
import {
  Send,
  Phone,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  ImagePlus,
  X,
  Pencil,
  Trash2,
  Check,
  Ban,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  sendMessage,
  simulateAgentReply,
  markThreadResolved,
  uploadSupportImage,
  editSupportMessage,
  deleteSupportMessage,
} from '@/app/dashboard/support/actions';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  computePresence,
  resolveAgentIdentity,
  type SupportSettings,
  type Presence,
} from '@/lib/support-presence';

type Thread = Database['public']['Tables']['support_threads']['Row'];
type Message = Database['public']['Tables']['support_messages']['Row'];

const TIME_FORMAT = new Intl.DateTimeFormat('fr-HT', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatTime(iso: string) {
  return TIME_FORMAT.format(new Date(iso));
}

export default function SupportChat({
  thread,
  initialMessages,
  support,
}: {
  thread: Thread;
  initialMessages: Message[];
  support: SupportSettings;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resolved, setResolved] = React.useState(thread.status !== 'open');
  const [resolving, setResolving] = React.useState(false);

  // An image staged for the next send.
  const [attachment, setAttachment] = React.useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  // Live availability — recompute every minute so the badge flips at open/close.
  const [presence, setPresence] = React.useState<Presence>(() =>
    computePresence(support)
  );
  React.useEffect(() => {
    setPresence(computePresence(support));
    const t = window.setInterval(() => setPresence(computePresence(support)), 60_000);
    return () => window.clearInterval(t);
  }, [support]);

  const identity = React.useMemo(
    () =>
      resolveAgentIdentity(support, {
        name: thread.agent_name,
        role: thread.agent_role,
        initials: thread.agent_initials,
      }),
    [support, thread.agent_name, thread.agent_role, thread.agent_initials]
  );

  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const stickRef = React.useRef(true);
  const messageIds = React.useRef(new Set(initialMessages.map((m) => m.id)));

  // Track whether the reader is parked near the bottom. Once they scroll up to
  // read older messages, we stop force-scrolling them back down.
  function onBodyScroll() {
    const el = bodyRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Auto-scroll to bottom on new messages — only when already at the bottom.
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  // Realtime subscription — pick up agent replies (and our own messages
  // echoed back from the server, dedup'd by id).
  React.useEffect(() => {
    const channel = supabase
      .channel(`support-thread-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const row = payload.new as Message;
          // The member's own messages are already rendered optimistically and
          // swapped to the canonical row on send. Ignoring the realtime echo of
          // our own 'user' rows prevents the duplicate that happened when the
          // echo raced the swap. Realtime is only needed for agent/system replies.
          if (row.sender_role === 'user') return;
          if (messageIds.current.has(row.id)) return;
          messageIds.current.add(row.id);
          setMessages((prev) => [...prev, row]);
          setTyping(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          // An edit or delete from the other side — patch the row in place.
          const row = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, thread.id]);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadSupportImage(fd);
    setUploading(false);
    if (res.ok) setAttachment({ url: res.url, name: file.name });
    else setError(res.error);
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    const img = attachment?.url ?? null;
    if ((!text && !img) || sending || resolved || uploading) return;

    // Decide BEFORE the optimistic insert so the just-sent message is not
    // counted. The auto-reply should fire exactly once per thread — right
    // after the member's first message.
    const isFirstUserMessage = messages.every((m) => m.sender_role !== 'user');

    setSending(true);
    setError(null);
    setDraft('');
    setAttachment(null);
    // Sending my own message always jumps me back to the newest message.
    stickRef.current = true;

    // Optimistic insert — replaced by realtime echo when it arrives
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      thread_id: thread.id,
      sender_role: 'user',
      sender_id: null,
      body: text,
      image_url: img,
      edited_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessage(thread.id, text, img);
    if (!result.ok) {
      setError(result.error);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setSending(false);
      return;
    }

    // Swap optimistic for canonical
    messageIds.current.add(result.message.id);
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? result.message : m))
    );
    setSending(false);

    if (!isFirstUserMessage) return;

    // Trigger the one-time auto-reply after a short delay so the typing
    // indicator shows for a beat — feels human and confirms receipt.
    setTyping(true);
    const replyDelay = 1400 + Math.random() * 900;
    setTimeout(async () => {
      const r = await simulateAgentReply(thread.id);
      if (!r.ok) {
        setTyping(false);
      }
    }, replyDelay);
  }

  async function onResolve() {
    setResolving(true);
    const res = await markThreadResolved(thread.id);
    setResolving(false);
    if (res.ok) setResolved(true);
  }

  async function onEditMessage(id: string, newBody: string) {
    const text = newBody.trim();
    if (!text) return;
    const prev = messages.find((m) => m.id === id) ?? null;
    setMessages((list) =>
      list.map((m) =>
        m.id === id ? { ...m, body: text, edited_at: new Date().toISOString() } : m
      )
    );
    const res = await editSupportMessage(id, text);
    if (res.ok) {
      setMessages((list) => list.map((m) => (m.id === id ? res.message : m)));
    } else {
      setError(res.error);
      if (prev) setMessages((list) => list.map((m) => (m.id === id ? prev : m)));
    }
  }

  async function onDeleteMessage(id: string) {
    const prev = messages.find((m) => m.id === id) ?? null;
    setMessages((list) =>
      list.map((m) =>
        m.id === id
          ? { ...m, body: '', image_url: null, deleted_at: new Date().toISOString() }
          : m
      )
    );
    const res = await deleteSupportMessage(id);
    if (res.ok) {
      setMessages((list) => list.map((m) => (m.id === id ? res.message : m)));
    } else {
      setError(res.error);
      if (prev) setMessages((list) => list.map((m) => (m.id === id ? prev : m)));
    }
  }

  const canSend = (!!draft.trim() || !!attachment) && !sending && !uploading;

  return (
    <div className="flex flex-col bg-white border border-cream-200 rounded-2xl shadow-card overflow-hidden h-[640px]">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-cream-200 bg-gradient-to-r from-cream-50 to-white">
        <AgentAvatar identity={identity} online={presence.online} size={44} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink truncate">{identity.name}</div>
          <div className="text-[11px] text-earth-600 flex items-center gap-1.5">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full inline-block',
                presence.online ? 'bg-forest-500' : 'bg-earth-300'
              )}
            />
            {presence.online ? `An liy · ${identity.role}` : presence.label}
          </div>
        </div>
        {!resolved && (
          <button
            type="button"
            onClick={onResolve}
            disabled={resolving}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-earth-700 hover:text-forest-700 border border-cream-200 hover:border-forest-300 rounded-lg transition disabled:opacity-60"
          >
            {resolving ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.2} />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
            Make rezoud
          </button>
        )}
        <button
          aria-label="Apèl"
          className="grid place-items-center w-9 h-9 rounded-full bg-cream-50 hover:bg-cream-100 text-earth-700 transition"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
        </button>
        <button
          aria-label="Plis"
          className="grid place-items-center w-9 h-9 rounded-full bg-cream-50 hover:bg-cream-100 text-earth-700 transition"
        >
          <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
        </button>
      </header>

      {/* Availability strip when offline */}
      {!presence.online && (
        <div className="px-5 py-2 text-[11px] text-earth-700 bg-amber-50/70 border-b border-amber-100 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-earth-300 shrink-0" />
          {presence.detail}
        </div>
      )}

      {/* Body */}
      <div
        ref={bodyRef}
        onScroll={onBodyScroll}
        className="flex-1 overflow-y-auto px-4 md:px-5 py-5 space-y-3 bg-[radial-gradient(circle_at_1px_1px,rgba(122,175,82,0.05)_1px,transparent_0)] bg-[length:22px_22px]"
      >
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            message={m}
            editable={m.sender_role === 'user' && !m.id.startsWith('optimistic-')}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
        ))}
        {typing && <TypingBubble />}
      </div>

      {/* Composer */}
      {resolved ? (
        <div className="px-5 py-4 border-t border-cream-200 bg-cream-50/70 text-sm text-earth-700 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
            Konvèsasyon sa a rezoud. Mèsi pou pasyans ou.
          </span>
        </div>
      ) : (
        <div className="border-t border-cream-200">
          {attachment && (
            <AttachmentPreview
              attachment={attachment}
              onRemove={() => setAttachment(null)}
            />
          )}
          <form onSubmit={onSend} className="px-3 md:px-4 py-3 flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={onPickImage}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || sending}
              aria-label="Ajoute yon imaj"
              className="grid place-items-center w-10 h-10 rounded-full bg-cream-50 hover:bg-cream-100 text-earth-700 transition shrink-0 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
              ) : (
                <ImagePlus className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
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
              placeholder="Ekri yon mesaj…"
              disabled={sending}
              className="flex-1 resize-none px-4 py-2.5 text-sm bg-cream-50 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 leading-relaxed max-h-32 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!canSend}
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
        </div>
      )}

      {error && (
        <div className="px-5 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}

function AgentAvatar({
  identity,
  online,
  size = 44,
}: {
  identity: { name: string; initials: string; photoUrl: string | null };
  online: boolean;
  size?: number;
}) {
  const dim = { width: size, height: size };
  return (
    <div className="relative shrink-0" style={dim}>
      {identity.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={identity.photoUrl}
          alt={identity.name}
          className="rounded-full object-cover shadow w-full h-full"
        />
      ) : (
        <div
          className="grid place-items-center rounded-full text-cream-50 font-display font-bold shadow w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(135deg, #e78e17, #985c0c)',
            fontSize: size * 0.36,
          }}
        >
          {identity.initials}
        </div>
      )}
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
          online ? 'bg-forest-500' : 'bg-earth-300'
        )}
      />
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: { url: string; name: string };
  onRemove: () => void;
}) {
  return (
    <div className="px-3 md:px-4 pt-3">
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-20 w-20 rounded-xl object-cover border border-cream-200"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retire imaj la"
          className="absolute -top-2 -right-2 grid place-items-center w-6 h-6 rounded-full bg-ink text-cream-50 shadow"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  editable,
  onEdit,
  onDelete,
}: {
  message: Message;
  editable: boolean;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const isMe = message.sender_role === 'user';
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.body);
  const [confirming, setConfirming] = React.useState(false);

  // Deleted → tombstone
  if (message.deleted_at) {
    return (
      <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[78%] px-3.5 py-2 rounded-2xl text-xs italic shadow-sm inline-flex items-center gap-1.5',
            isMe
              ? 'bg-forest-700/50 text-cream-100 rounded-br-md'
              : 'bg-cream-100 text-earth-500 border border-cream-200 rounded-bl-md'
          )}
        >
          <Ban className="w-3 h-3" strokeWidth={2} />
          Mesaj efase
        </div>
      </div>
    );
  }

  // Inline edit
  if (editing) {
    const save = () => {
      const t = editText.trim();
      if (t) {
        onEdit(message.id, t);
        setEditing(false);
      }
    };
    return (
      <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[85%] w-full">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === 'Escape') {
                setEditing(false);
                setEditText(message.body);
              }
            }}
            rows={2}
            autoFocus
            className="w-full resize-none px-3 py-2 text-sm bg-white border border-forest-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
          <div className="flex items-center gap-2 mt-1 justify-end">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditText(message.body);
              }}
              className="text-xs font-semibold text-earth-500 hover:text-ink px-2 py-1"
            >
              Anile
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!editText.trim()}
              className="text-xs font-semibold text-cream-50 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 px-3 py-1 rounded-lg"
            >
              Anrejistre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group flex items-end gap-1', isMe ? 'justify-end' : 'justify-start')}>
      {isMe && editable && (
        <BubbleActions
          confirming={confirming}
          canEdit={!!message.body}
          onEdit={() => {
            setEditText(message.body);
            setEditing(true);
          }}
          onAskDelete={() => setConfirming(true)}
          onConfirmDelete={() => {
            setConfirming(false);
            onDelete(message.id);
          }}
          onCancelDelete={() => setConfirming(false)}
        />
      )}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden',
          isMe
            ? 'bg-forest-700 text-cream-50 rounded-br-md'
            : 'bg-white border border-cream-200 text-ink rounded-bl-md'
        )}
      >
        {message.image_url && (
          <a
            href={message.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-cream-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.image_url}
              alt="Imaj"
              className="max-h-72 max-w-full object-contain"
            />
          </a>
        )}
        <div className={cn(message.image_url && !message.body ? 'px-3 pb-1.5 pt-1' : 'px-3.5 py-2')}>
          {message.body && (
            <div className="whitespace-pre-wrap break-words">{message.body}</div>
          )}
          <div
            className={cn(
              'text-[10px] mt-1 text-right',
              isMe ? 'text-cream-200/80' : 'text-earth-500'
            )}
          >
            {message.edited_at && <span className="mr-1 italic">modifye ·</span>}
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

function BubbleActions({
  confirming,
  canEdit,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  confirming: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  if (confirming) {
    return (
      <div className="flex items-center gap-1 mb-1 shrink-0">
        <span className="text-[10px] text-earth-500">Efase?</span>
        <button
          type="button"
          onClick={onConfirmDelete}
          aria-label="Konfime efase"
          className="grid place-items-center w-6 h-6 rounded-full bg-rose-600 text-white hover:bg-rose-700"
        >
          <Check className="w-3 h-3" strokeWidth={2.6} />
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          aria-label="Anile"
          className="grid place-items-center w-6 h-6 rounded-full bg-cream-100 text-earth-600 hover:bg-cream-200"
        >
          <X className="w-3 h-3" strokeWidth={2.6} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 mb-1 shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition">
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Modifye mesaj la"
          className="grid place-items-center w-6 h-6 rounded-full bg-cream-100 text-earth-600 hover:text-forest-700 hover:bg-cream-200"
        >
          <Pencil className="w-3 h-3" strokeWidth={2.2} />
        </button>
      )}
      <button
        type="button"
        onClick={onAskDelete}
        aria-label="Efase mesaj la"
        className="grid place-items-center w-6 h-6 rounded-full bg-cream-100 text-earth-600 hover:text-rose-600 hover:bg-cream-200"
      >
        <Trash2 className="w-3 h-3" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-cream-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-earth-400 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-earth-400 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-earth-400 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}
