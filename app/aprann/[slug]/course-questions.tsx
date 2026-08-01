'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { askCourseQuestion } from './question-actions';

type QA = {
  id: string;
  body: string;
  answer: string | null;
  created_at: string;
};

export default function CourseQuestions({
  courseId,
  initial,
}: {
  courseId: string;
  initial: QA[];
}) {
  const router = useRouter();
  const [body, setBody] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    const text = body.trim();
    if (text.length < 3 || pending) return;
    setPending(true);
    setError(null);
    const res = await askCourseQuestion(courseId, null, text).catch(() => ({
      ok: false as const,
      error: 'Yon erè rive.',
    }));
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Yon erè rive.');
      return;
    }
    setBody('');
    router.refresh();
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-1">
        <HelpCircle className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        Poze yon kesyon
      </h2>
      <p className="text-xs text-earth-600 mb-4">
        Ton vye a ap reponn kesyon w yo sou kou a.
      </p>

      <div className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Ekri kesyon w sou kou a…"
          className="w-full text-sm rounded-xl border border-cream-200 bg-white px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-forest-200 resize-y"
        />
        {error && <p className="text-xs text-rose-700">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={pending || body.trim().length < 3}
          className="self-end inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 px-4 py-2 rounded-full text-sm font-semibold transition"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Send className="w-4 h-4" strokeWidth={2.2} />
          )}
          Voye kesyon an
        </button>
      </div>

      {initial.length > 0 && (
        <ul className="mt-6 space-y-3 border-t border-cream-200 pt-5">
          {initial.map((q) => (
            <li
              key={q.id}
              className="rounded-xl bg-cream-50 border border-cream-200 p-3"
            >
              <p className="text-sm text-ink font-medium whitespace-pre-wrap">
                {q.body}
              </p>
              {q.answer ? (
                <div className="mt-2 rounded-lg bg-forest-50 border border-forest-100 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-forest-700 mb-0.5 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
                    Repons Ton vye
                  </div>
                  <p className="text-sm text-ink/90 whitespace-pre-wrap">
                    {q.answer}
                  </p>
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-earth-500 italic">
                  N ap tann repons…
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
