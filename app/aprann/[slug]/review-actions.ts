'use server';

import { createClient } from '@/lib/supabase/server';

// A student rates + reviews a course they're enrolled in. One row per
// (course, user) — upserted.
export async function submitReview(
  courseId: string,
  rating: number,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const r = Math.round(rating);
  if (r < 1 || r > 5) return { ok: false, error: 'Nòt la dwe ant 1 ak 5.' };

  const { data: enrolled } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!enrolled) return { ok: false, error: 'Ou dwe enskri pou bay yon nòt.' };

  const { data: prof } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();
  const p = prof as { full_name: string | null; email: string } | null;
  const author = (p?.full_name || p?.email?.split('@')[0] || 'Elèv').split(
    ' '
  )[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = await sb.from('course_reviews').upsert(
    {
      course_id: courseId,
      user_id: user.id,
      rating: r,
      body: body.trim().slice(0, 1500) || null,
      author_name: author,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'course_id,user_id' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
