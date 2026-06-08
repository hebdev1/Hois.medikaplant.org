'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { replyToContactMessage } from '../actions';

/**
 * Inline reply composer. Calls the server action, which sends the email
 * via Resend and persists the reply body. We disable the button while
 * pending and clear the textarea on success.
 */
export default function ContactReplyForm({
  id,
  toName,
  toEmail,
  previousResponse,
}: {
  id: string;
  toName: string;
  toEmail: string;
  previousResponse: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function submit() {
    setError(null);
    setSuccess(null);
    setWarning(null);
    if (body.trim().length < 10) {
      setError('Repons la twò kout (omwen 10 karaktè).');
      return;
    }
    startTransition(async () => {
      const res = await replyToContactMessage(id, body);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (!res.emailSent) {
        setWarning(
          `Repons anrejistre, men imèl pa t voye: ${res.emailError ?? 'RESEND_API_KEY pa konfigire'}. ` +
            `Ou ka kopye tèks la epi voye li manyèlman bay ${toEmail}.`
        );
      } else {
        setSuccess(`Imèl voye bay ${toEmail}.`);
      }
      setBody('');
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <header className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-earth-600 font-bold mb-1">
          {previousResponse ? 'Voye yon nouvo repons' : 'Reponn'}
        </div>
        <h3 className="font-display text-lg font-bold text-ink">
          Reponn bay {toName}
        </h3>
        <p className="text-xs text-earth-600 mt-0.5">
          Imèl la ap voye bay <span className="font-mono">{toEmail}</span>.
        </p>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-forest-50 border border-forest-200 px-3 py-2 text-sm text-forest-800 flex items-start gap-2 mb-3">
          <CheckCircle2
            className="w-4 h-4 mt-0.5 shrink-0"
            strokeWidth={2.4}
          />
          <span>{success}</span>
        </div>
      )}
      {warning && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900 flex items-start gap-2 mb-3">
          <AlertTriangle
            className="w-4 h-4 mt-0.5 shrink-0"
            strokeWidth={2.4}
          />
          <span>{warning}</span>
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={8}
        placeholder={`Bonjou ${toName},\n\nMèsi paske w te kontakte nou. ...`}
        className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-earth-400 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 transition resize-y leading-relaxed"
        disabled={pending}
      />
      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
        <span className="text-[11px] text-earth-500">
          {body.length} / 5000 karaktè
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={pending || body.trim().length < 10}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 text-sm font-semibold transition"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={2.4} />
          {pending ? 'Voye...' : 'Voye repons'}
        </button>
      </div>
    </section>
  );
}
