'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// User-facing enrollment action invoked by the "Pran plas mwen" button
// on /klas/[slug]. Translates the RPC's compact JSON error codes into
// friendly Kreyòl messages so the public page doesn't have to know the
// shape of the underlying check.

export type EnrollResult =
  | { ok: true }
  | { ok: false; error: string; full?: boolean; needsLogin?: boolean };

const PLAN_LABEL: Record<string, string> = {
  basic: 'Bazilik',
  premium: 'Sitwonèl',
  vip: 'Melis',
};

export async function enrollInCourse(courseId: string): Promise<EnrollResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      needsLogin: true,
      error: 'Ou dwe konekte anvan pou w pran plas ou.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data, error } = await sb.rpc('enroll_in_course', {
    p_course_id: courseId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  const res = data as
    | {
        ok: true;
      }
    | {
        ok: false;
        error: string;
        capacity?: number;
        required?: string;
        current?: string;
      };

  if (!res?.ok) {
    switch (res?.error) {
      case 'course_full':
        return {
          ok: false,
          full: true,
          error: `Klas la konplè. Tout ${res.capacity ?? ''} plas yo deja okipe.`,
        };
      case 'course_not_found':
        return { ok: false, error: 'Klas la pa egziste oswa li pa pibliye.' };
      case 'course_inactive':
        return { ok: false, error: 'Klas sa a poko aktif.' };
      case 'plan_too_low':
        return {
          ok: false,
          error: `Plan ou (${PLAN_LABEL[res.current ?? ''] ?? res.current}) twò ba. Klas sa a mande plan ${PLAN_LABEL[res.required ?? ''] ?? res.required} oswa pi wo.`,
        };
      case 'not_authenticated':
        return {
          ok: false,
          needsLogin: true,
          error: 'Ou dwe konekte anvan.',
        };
      default:
        return { ok: false, error: res?.error ?? 'Erè enkoni.' };
    }
  }

  revalidatePath(`/klas/${courseId}`);
  revalidatePath('/klas');
  revalidatePath('/dashboard');
  return { ok: true };
}
