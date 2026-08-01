'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { answerCourseQuestion } from './actions';

export default function AnswerForm({
  questionId,
  initialAnswer,
}: {
  questionId: string;
  initialAnswer: string | null;
}) {
  const router = useRouter();
  const [answer, setAnswer] = React.useState(initialAnswer ?? '');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    const text = answer.trim();
    if (text.length < 2 || pending) return;
    setPending(true);
    setError(null);
    const res = await answerCourseQuestion(questionId, text).catch(() => ({
      ok: false as const,
      error: 'Yon erè rive.',
    }));
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Yon erè rive.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="Ekri repons ou…"
        className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-y"
      />
      {error && <p className="text-xs text-rose-700 mt-1">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || answer.trim().length < 2}
        className="mt-2 inline-flex items-center gap-1.5 bg-ink hover:bg-brand-gradient disabled:opacity-50 text-cream-50 px-4 py-2 rounded-full text-sm font-semibold transition"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
        ) : (
          <Send className="w-4 h-4" strokeWidth={2.2} />
        )}
        {initialAnswer ? 'Mete repons ajou' : 'Reponn'}
      </button>
    </div>
  );
}
