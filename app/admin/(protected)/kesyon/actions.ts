'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../admin-nav-config';

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { role: string; admin_role: AdminRole | null } | null;
  if (row?.role !== 'admin') return { ok: false as const, error: 'Aksè entèdi.' };
  if (!hasCapability(row.admin_role, 'manage_courses')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere klas yo.' };
  }
  return { ok: true as const, userId: user.id };
}

export async function answerCourseQuestion(
  questionId: string,
  answer: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const text = answer.trim();
  if (text.length < 2) return { ok: false, error: 'Repons lan twò kout.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;

  const { data: qRaw } = await sb
    .from('course_questions')
    .select('user_id, course_id')
    .eq('id', questionId)
    .maybeSingle();
  const q = qRaw as { user_id: string; course_id: string } | null;
  if (!q) return { ok: false, error: 'Kesyon an pa jwenn.' };

  const { error } = await sb
    .from('course_questions')
    .update({
      answer: text.slice(0, 4000),
      answered_by: auth.userId,
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId);
  if (error) return { ok: false, error: error.message };

  // Notify the student (best-effort — a failed notification must not fail the
  // answer). Links back to the course in their student area.
  const { data: courseRaw } = await sb
    .from('courses')
    .select('slug')
    .eq('id', q.course_id)
    .maybeSingle();
  const slug = (courseRaw as { slug: string } | null)?.slug;
  await sb.from('notifications').insert({
    title: 'Ton vye reponn kesyon w',
    message: 'Gen yon repons pou yon kesyon w te poze sou yon kou.',
    target: 'user',
    target_user_id: q.user_id,
    link_url: slug ? `/aprann/${slug}` : '/aprann',
  });

  revalidatePath('/admin/kesyon');
  return { ok: true };
}
