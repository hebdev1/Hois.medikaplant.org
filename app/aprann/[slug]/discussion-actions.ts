'use server';

import { createClient } from '@/lib/supabase/server';

// Post to a course discussion. RLS enforces that only an enrolled student can
// write (and only as themselves); we add the display name for rendering.
export async function postToCourse(
  courseId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const text = body.trim();
  if (text.length < 2) return { ok: false, error: 'Mesaj la twò kout.' };

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
  const { error } = await sb.from('course_posts').insert({
    course_id: courseId,
    user_id: user.id,
    author_name: author,
    body: text.slice(0, 2000),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
