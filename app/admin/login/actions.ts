'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AdminLoginState = {
  error?: string;
  ok?: boolean;
};

/**
 * Sign in a member, then verify they have the `admin` role.
 *
 * Three rejection modes — all surface as a friendly error in the form:
 *   - Bad credentials                → "Imel oswa modpas pa kòrèk."
 *   - Profile missing (orphaned)     → "Pwofil pa jwenn. Kontakte sipò."
 *   - Profile present but not admin  → "Kont sa pa gen aksè administratè."
 *
 * On the third case we explicitly sign out so the visitor doesn't end up
 * with a half-authenticated session that would let them browse /dashboard
 * unintentionally. They asked for /admin, so we keep them on /admin.
 */
export async function signInAsAdmin(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = (formData.get('email')?.toString() ?? '').trim().toLowerCase();
  const password = formData.get('password')?.toString() ?? '';

  if (!email || !password) {
    return { error: 'Email ak modpas obligatwa.' };
  }

  const supabase = createClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.user) {
    return { error: 'Imel oswa modpas pa kòrèk.' };
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .maybeSingle();

  const role = (profileRaw as { role: 'user' | 'admin' } | null)?.role;

  if (!profileRaw) {
    await supabase.auth.signOut();
    return { error: 'Pwofil pa jwenn. Kontakte sipò teknik.' };
  }

  if (role !== 'admin') {
    await supabase.auth.signOut();
    return {
      error:
        'Kont sa pa gen aksè administratè. Sèvi ak /auth/login pou kont manm.',
    };
  }

  revalidatePath('/admin', 'layout');
  redirect('/admin');
}

/**
 * Sign out from anywhere in the admin area and land back on /admin/login.
 * Used by the sidebar "Dekonèkte" button.
 */
export async function adminSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/admin', 'layout');
  redirect('/admin/login');
}
