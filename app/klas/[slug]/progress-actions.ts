'use server';

import { createClient } from '@/lib/supabase/server';

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
