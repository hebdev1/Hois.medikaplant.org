'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Result = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return { ok: true as const, user, supabase };
}

// ─── Topic moderation ─────────────────────────────────────────────────────

export async function adminTogglePinTopic(id: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: topic } = await auth.supabase
    .from('forum_topics')
    .select('id, pinned')
    .eq('id', id)
    .maybeSingle();
  const row = topic as { id: string; pinned: boolean } | null;
  if (!row) return { ok: false, error: 'Sijè a pa jwenn.' };

  const { error } = await auth.supabase
    .from('forum_topics')
    .update({ pinned: !row.pinned })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}

export async function adminToggleLockTopic(id: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: topic } = await auth.supabase
    .from('forum_topics')
    .select('id, locked')
    .eq('id', id)
    .maybeSingle();
  const row = topic as { id: string; locked: boolean } | null;
  if (!row) return { ok: false, error: 'Sijè a pa jwenn.' };

  const { error } = await auth.supabase
    .from('forum_topics')
    .update({ locked: !row.locked })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}

export async function adminDeleteTopic(id: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('forum_topics')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}

export async function adminDeleteReply(id: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('forum_replies')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}

// ─── Category CRUD ────────────────────────────────────────────────────────

export type CategoryState = {
  error?: string;
  ok?: boolean;
};

type CategoryInsert = Database['public']['Tables']['forum_categories']['Insert'];

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Upsert by id. Pass id="" to create a new category; pass an existing id
 * to update. Slug is auto-generated from the name on create if missing.
 */
export async function adminUpsertCategory(
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const id = formData.get('id')?.toString() ?? '';
  const name = (formData.get('name')?.toString() ?? '').trim();
  const description =
    (formData.get('description')?.toString() ?? '').trim() || null;
  const color =
    (formData.get('color')?.toString() ?? '').trim() || '#5A9138';
  const icon = (formData.get('icon')?.toString() ?? '').trim() || null;
  const displayOrderRaw = formData.get('display_order')?.toString() ?? '0';
  const display_order = Math.max(0, Number.parseInt(displayOrderRaw, 10) || 0);

  if (name.length < 2) return { error: 'Non kategori a twò kout.' };
  if (name.length > 60) return { error: 'Non kategori a twò long.' };
  if (!/^#[0-9a-f]{3,8}$/i.test(color)) {
    return { error: 'Koulè dwe yon kòd hex (ex. #5A9138).' };
  }

  if (id) {
    // Update — slug stays as-is so old links keep working
    const { error } = await auth.supabase
      .from('forum_categories')
      .update({
        name,
        description,
        color,
        icon,
        display_order,
      })
      .eq('id', id);
    if (error) return { error: error.message };
  } else {
    // Create — generate slug, ensure uniqueness with -1, -2, …
    let baseSlug = slugify(name) || 'kategori';
    let candidate = baseSlug;
    let n = 0;
    while (true) {
      const { data: existing } = await auth.supabase
        .from('forum_categories')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!existing) break;
      n += 1;
      candidate = `${baseSlug}-${n}`;
    }

    const insert: CategoryInsert = {
      slug: candidate,
      name,
      description,
      color,
      icon,
      display_order,
    };
    const { error } = await auth.supabase
      .from('forum_categories')
      .insert(insert);
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}

export async function adminDeleteCategory(id: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Topics on this category will get category_id set to null via the
  // ON DELETE SET NULL fk. So deleting a category is non-destructive
  // for the conversations themselves.
  const { error } = await auth.supabase
    .from('forum_categories')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}

export async function adminSetTopicCategory(
  topicId: string,
  categoryId: string | null
): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('forum_topics')
    .update({ category_id: categoryId })
    .eq('id', topicId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/forum');
  revalidatePath('/dashboard/forum');
  return { ok: true };
}
