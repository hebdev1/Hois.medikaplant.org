'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleSaveGuide(
  guideId: string
): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data: existing } = await supabase
    .from('user_guide_saves')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('guide_id', guideId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_guide_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('guide_id', guideId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard/guides');
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from('user_guide_saves')
    .insert({ user_id: user.id, guide_id: guideId });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/guides');
  return { ok: true, saved: true };
}

export async function recordGuideView(guideId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('increment_guide_view', { p_guide_id: guideId });
}
