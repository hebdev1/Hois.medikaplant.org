'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { markModuleComplete } from '@/app/klas/[slug]/progress-actions';

// Marks a video lesson done (writes course_module_progress) so progress bars
// and the completion certificate work for on-demand courses too — not just
// interactive ones.
export default function LessonCompleteButton({
  courseId,
  moduleId,
  initialDone,
}: {
  courseId: string;
  moduleId: string;
  initialDone: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = React.useState(initialDone);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    if (pending) return;
    const next = !done;
    setPending(true);
    setDone(next);
    const res = await markModuleComplete(courseId, moduleId, next).catch(() => ({
      ok: false as const,
    }));
    if (!res.ok) {
      setDone(!next);
    } else {
      router.refresh();
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-70 ${
        done
          ? 'bg-forest-100 text-forest-800 hover:bg-forest-200'
          : 'bg-forest-700 hover:bg-forest-800 text-cream-50'
      }`}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
      ) : done ? (
        <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
      ) : (
        <Circle className="w-4 h-4" strokeWidth={2.2} />
      )}
      {done ? 'Leson fini ✓' : 'Make leson sa a fini'}
    </button>
  );
}
