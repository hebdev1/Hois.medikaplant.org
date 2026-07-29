'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { ModuleContent } from '@/lib/klas/course-content';

// Grade one quiz answer SERVER-SIDE. The correct answer lives only in the
// module content read here (service role) — it is never shipped to the client
// (see stripQuizAnswers), so a student cannot look it up in the page.
export async function gradeAnswer(
  moduleId: string,
  qi: number,
  response: number | number[] | string
): Promise<{ correct: boolean; feedback?: string; answerText?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const { data } = await sb
    .from('course_modules')
    .select('content')
    .eq('id', moduleId)
    .maybeSingle();
  const content = (data?.content ?? null) as ModuleContent | null;
  const q = content?.quiz?.[qi];
  if (!q) return { correct: false };

  const type = q.type ?? 'single';
  if (type === 'multiple') {
    const want = new Set(q.correctSet ?? []);
    const got = Array.isArray(response) ? response : [];
    const correct =
      want.size === got.length && got.every((r) => want.has(r));
    const answerText = (q.correctSet ?? [])
      .map((i) => q.choices?.[i])
      .filter(Boolean)
      .join(', ');
    return { correct, feedback: q.feedback, answerText };
  }
  if (type === 'short') {
    const accepted = (q.answer ?? '')
      .split('|')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const correct =
      typeof response === 'string' &&
      accepted.includes(response.trim().toLowerCase());
    return {
      correct,
      feedback: q.feedback,
      answerText: (q.answer ?? '').split('|')[0]?.trim(),
    };
  }
  // single
  const correct = response === q.correct;
  return {
    correct,
    feedback: q.feedback,
    answerText: q.choices?.[q.correct ?? -1],
  };
}

// Toggle a member's completion of one module. RLS guarantees a member can only
// ever write their own row, so we scope by the authenticated user id.
export async function markModuleComplete(
  courseId: string,
  moduleId: string,
  done: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte pou sove pwogrè.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  if (done) {
    const { error } = await sb
      .from('course_module_progress')
      .upsert(
        { user_id: user.id, course_id: courseId, module_id: moduleId },
        { onConflict: 'user_id,module_id' }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb
      .from('course_module_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('module_id', moduleId);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}
