'use client';

import React from 'react';
import { MessageCircle, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminSendMessage } from '../actions';

// Admin starts (or continues) the private conversation the member reads in
// their floating message box. Distinct from the notification form above:
// this is a two-way chat the member can reply to.
export default function MessageComposer({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [body, setBody] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [state, setState] = React.useState<{ ok?: boolean; error?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (text.length < 2) return;
    setPending(true);
    setState({});
    const res = await adminSendMessage(userId, text);
    setPending(false);
    if (res.ok) {
      setState({ ok: true });
      setBody('');
    } else {
      setState({ error: res.error });
    }
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-forest-100 text-forest-700">
            <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink leading-tight">
              Voye yon mesaj privé
            </h2>
            <p className="text-xs text-earth-600 mt-0.5">
              Yon konvèsasyon <span className="font-medium text-earth-700">{email}</span> ka
              reponn — l ap parèt nan bwat mesaj li.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={2}
          maxLength={4000}
          rows={3}
          placeholder="Ekri mesaj la an Kreyòl…"
          className="w-full px-3 py-2 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-300 resize-y"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            {state.error && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-700">
                <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.4} /> {state.error}
              </span>
            )}
            {state.ok && (
              <span className="inline-flex items-center gap-1 text-xs text-forest-700">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} /> Mesaj voye!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={pending || body.trim().length < 2}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2.2} />
            )}
            Voye mesaj
          </button>
        </div>
      </form>
    </section>
  );
}
