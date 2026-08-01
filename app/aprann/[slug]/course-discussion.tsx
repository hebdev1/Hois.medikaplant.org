'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, Send } from 'lucide-react';
import { postToCourse } from './discussion-actions';

type Post = {
  id: string;
  user_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

function relTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'kounye a';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} è`;
  return `${Math.floor(hrs / 24)} jou`;
}

export default function CourseDiscussion({
  courseId,
  currentUserId,
  initial,
}: {
  courseId: string;
  currentUserId: string;
  initial: Post[];
}) {
  const router = useRouter();
  const [body, setBody] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    const text = body.trim();
    if (text.length < 2 || pending) return;
    setPending(true);
    setError(null);
    const res = await postToCourse(courseId, text).catch(() => ({
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
        <Users className="w-4 h-4 text-forest-700" strokeWidth={2.2} />
        Diskisyon
      </h2>
      <p className="text-xs text-earth-600 mb-4">
        Pataje ak lòt elèv ki nan kou a.
      </p>

      <div className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Ekri yon mesaj…"
          className="w-full text-sm rounded-xl border border-cream-200 bg-white px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-forest-200 resize-y"
        />
        {error && <p className="text-xs text-rose-700">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={pending || body.trim().length < 2}
          className="self-end inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 px-4 py-2 rounded-full text-sm font-semibold transition"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Send className="w-4 h-4" strokeWidth={2.2} />
          )}
          Pibliye
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="mt-4 text-sm text-earth-500 text-center">
          Poko gen mesaj. Kòmanse konvèsasyon an!
        </p>
      ) : (
        <ul className="mt-5 space-y-3.5 border-t border-cream-200 pt-4">
          {initial.map((p) => (
            <li key={p.id} className="flex gap-2.5">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-forest-100 text-forest-700 text-xs font-bold shrink-0">
                {(p.author_name ?? 'E').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs">
                  <span className="font-semibold text-ink">
                    {p.author_name ?? 'Elèv'}
                    {p.user_id === currentUserId ? ' (ou)' : ''}
                  </span>{' '}
                  <span className="text-earth-500">· {relTime(p.created_at)}</span>
                </div>
                <p className="text-sm text-ink/90 whitespace-pre-wrap mt-0.5">
                  {p.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
