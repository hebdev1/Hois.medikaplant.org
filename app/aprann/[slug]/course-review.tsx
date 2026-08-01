'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { submitReview } from './review-actions';

export default function CourseReview({
  courseId,
  initialRating,
  initialBody,
}: {
  courseId: string;
  initialRating: number | null;
  initialBody: string | null;
}) {
  const router = useRouter();
  const [rating, setRating] = React.useState(initialRating ?? 0);
  const [hover, setHover] = React.useState(0);
  const [body, setBody] = React.useState(initialBody ?? '');
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    if (rating < 1 || pending) return;
    setPending(true);
    setError(null);
    const res = await submitReview(courseId, rating, body).catch(() => ({
      ok: false as const,
      error: 'Yon erè rive.',
    }));
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Yon erè rive.');
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <section className="bg-white border border-cream-200 rounded-2xl p-5 md:p-6 shadow-card">
      <h2 className="font-display text-lg font-bold text-ink mb-1">
        {initialRating ? 'Nòt ou bay' : 'Bay nòt ou'}
      </h2>
      <p className="text-xs text-earth-600 mb-3">
        Pataje eksperyans ou pou ede lòt elèv yo.
      </p>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} etwal`}
            className="p-0.5"
          >
            <Star
              className={`w-7 h-7 transition ${
                (hover || rating) >= n
                  ? 'text-gold-500 fill-gold-400'
                  : 'text-cream-300'
              }`}
              strokeWidth={1.8}
            />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Yon ti mo sou kou a (opsyonèl)…"
        className="w-full text-sm rounded-xl border border-cream-200 bg-white px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-forest-200 resize-y"
      />
      {error && <p className="text-xs text-rose-700 mt-1">{error}</p>}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || rating < 1}
          className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 px-5 py-2 rounded-full text-sm font-semibold transition"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Star className="w-4 h-4" strokeWidth={2.2} />
          )}
          {initialRating ? 'Mete nòt ajou' : 'Voye nòt mwen'}
        </button>
        {done && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.4} />
            Mèsi!
          </span>
        )}
      </div>
    </section>
  );
}
