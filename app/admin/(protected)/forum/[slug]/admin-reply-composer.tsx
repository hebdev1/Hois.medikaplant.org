'use client';

import React from 'react';
import {
  Send,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { adminPostReply } from '../actions';

type Props = {
  topicId: string;
  topicLocked: boolean;
  adminInitials: string;
  adminName: string;
};

/**
 * Composer rendered at the bottom of /admin/forum/[slug]. Lets an admin
 * post a reply (or a moderator note) into any topic, including locked
 * ones — the admin RLS policy bypasses the locked check that regular
 * members hit.
 */
export default function AdminReplyComposer({
  topicId,
  topicLocked,
  adminInitials,
  adminName,
}: Props) {
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const successTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  React.useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    []
  );

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setError(null);
    setSending(true);
    const res = await adminPostReply(topicId, text);
    setSending(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setDraft('');
    setSuccess(true);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(false), 2400);
  }

  const remaining = 4000 - draft.length;

  return (
    <section className="bg-white border border-accent/30 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-accent/20 bg-gradient-to-r from-accent/10 via-accent/5 to-white flex items-center gap-2.5">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white shadow shrink-0">
          <ShieldAlert className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-sm font-bold text-ink leading-tight">
            Reponn kòm administratè
          </h2>
          <p className="text-[11px] text-earth-600 mt-0.5">
            {topicLocked
              ? 'Sijè a fèmen pou manm yo, men admin ka toujou reponn.'
              : `Ou ap reponn kòm ${adminName} — manm yo ap wè li an direk ak yon badj Admin.`}
          </p>
        </div>
        {topicLocked && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            <Lock className="w-2.5 h-2.5" strokeWidth={2.4} />
            Fèmen
          </span>
        )}
      </header>

      <form onSubmit={onSend} className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white font-display font-bold text-sm shrink-0">
            {adminInitials}
          </span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={3}
            maxLength={4000}
            placeholder="Ekri repons / nòt moderasyon ou… (Ctrl+Enter pou voye)"
            disabled={sending}
            className="flex-1 resize-y px-4 py-2.5 text-sm bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 leading-relaxed disabled:opacity-60 min-h-[80px]"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-earth-500 flex items-center gap-2">
            <span
              className={
                remaining < 100 ? 'text-rose-700 font-semibold' : undefined
              }
            >
              {remaining} karaktè
            </span>
            {success && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
                Voye!
              </span>
            )}
            {error && (
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-700">
                <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
                {error}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-gradient-to-r from-accent to-accent-dark hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition shadow"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2.2} />
            )}
            Voye repons
          </button>
        </div>
      </form>
    </section>
  );
}
