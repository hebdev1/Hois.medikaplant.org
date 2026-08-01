'use server';

import { createClient } from '@/lib/supabase/server';

// Autosave a student's personal note for one lesson. RLS scopes writes to the
// authenticated user, so we only need their id.
export async function saveLessonNote(
  moduleId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const clean = body.slice(0, 5000);
  // lesson_notes isn't in the generated types yet — cast the client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = await sb.from('lesson_notes').upsert(
    {
      user_id: user.id,
      module_id: moduleId,
      body: clean,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,module_id' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
