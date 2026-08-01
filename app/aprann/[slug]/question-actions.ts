'use server';

import { createClient } from '@/lib/supabase/server';

// A student asks a question about a course. RLS scopes the insert to the
// authenticated user; we also confirm enrolment here.
export async function askCourseQuestion(
  courseId: string,
  moduleId: string | null,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const text = body.trim();
  if (text.length < 3) return { ok: false, error: 'Kesyon an twò kout.' };

  const { data: enrolled } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!enrolled) return { ok: false, error: 'Ou dwe enskri nan kou a.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = await sb.from('course_questions').insert({
    course_id: courseId,
    module_id: moduleId,
    user_id: user.id,
    body: text.slice(0, 2000),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
