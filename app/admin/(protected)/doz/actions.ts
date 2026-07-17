'use server';

// CRUD for "Resèt ak Dòz" (doz_recipes) + its categories (doz_categories).
// Mirrors the Guides admin. Any admin (role='admin') may manage these.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

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
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

const visibleLen = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().length;

export type DozState = { error?: string; ok?: boolean; id?: string };

function readForm(fd: FormData) {
  const get = (k: string) => (fd.get(k)?.toString() ?? '').trim();
  return {
    title: get('title'),
    slug: get('slug'),
    excerpt: get('excerpt') || null,
    body_html: get('body_html'),
    category_id: get('category_id') || null,
    tag: get('tag') || null,
    cover_image_url: get('cover_image_url') || null,
    published: fd.get('published') === 'on',
  };
}

async function saveRecipe(
  recipeId: string | null,
  fd: FormData
): Promise<DozState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const input = readForm(fd);
  if (input.title.length < 4) return { error: 'Tit la twò kout.' };
  if (visibleLen(input.body_html) < 20) return { error: 'Kontni an twò kout.' };
  const slug = slugify(input.slug || input.title);
  if (slug.length < 3) return { error: 'Slug la pa valid.' };

  const payload = {
    slug,
    title: input.title,
    excerpt: input.excerpt,
    body_html: input.body_html,
    category_id: input.category_id,
    tag: input.tag,
    cover_image_url: input.cover_image_url,
    published: input.published,
    published_at: input.published ? new Date().toISOString() : null,
  };

  if (recipeId) {
    const { error } = await auth.sb.from('doz_recipes').update(payload).eq('id', recipeId);
    if (error) return { error: error.code === '23505' ? 'Slug sa a deja itilize.' : error.message };
    revalidatePath('/admin/doz');
    revalidatePath('/dashboard/reset-doz');
    revalidatePath(`/dashboard/reset-doz/${slug}`);
    return { ok: true, id: recipeId };
  }

  const { data, error } = await auth.sb
    .from('doz_recipes')
    .insert({ ...payload, created_by: auth.user.id })
    .select('id')
    .single();
  if (error || !data) {
    return { error: error?.code === '23505' ? 'Slug sa a deja itilize.' : (error?.message ?? 'Erè.') };
  }
  revalidatePath('/admin/doz');
  revalidatePath('/dashboard/reset-doz');
  redirect(`/admin/doz/${(data as { id: string }).id}?created=1`);
}

export async function createDoz(_p: DozState, fd: FormData) {
  return saveRecipe(null, fd);
}
export async function updateDoz(recipeId: string, _p: DozState, fd: FormData) {
  return saveRecipe(recipeId, fd);
}

export async function deleteDoz(recipeId: string): Promise<DozState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('doz_recipes').delete().eq('id', recipeId);
  if (error) return { error: error.message };
  revalidatePath('/admin/doz');
  revalidatePath('/dashboard/reset-doz');
  return { ok: true };
}

export async function toggleDozPublished(recipeId: string): Promise<DozState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { data } = await auth.sb.from('doz_recipes').select('published').eq('id', recipeId).maybeSingle();
  const next = !(data as { published?: boolean } | null)?.published;
  const { error } = await auth.sb
    .from('doz_recipes')
    .update({ published: next, published_at: next ? new Date().toISOString() : null })
    .eq('id', recipeId);
  if (error) return { error: error.message };
  revalidatePath('/admin/doz');
  revalidatePath('/dashboard/reset-doz');
  return { ok: true };
}

// ── Categories ──────────────────────────────────────────────────────────────
export async function saveDozCategory(
  categoryId: string | null,
  _p: DozState,
  fd: FormData
): Promise<DozState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const label = (fd.get('label')?.toString() ?? '').trim();
  if (label.length < 2) return { error: 'Non kategori a twò kout.' };
  const order = Math.max(0, Number(fd.get('display_order')) || 0);
  const slug = slugify(label);

  if (categoryId) {
    const { error } = await auth.sb.from('doz_categories').update({ label, display_order: order }).eq('id', categoryId);
    if (error) return { error: error.message };
  } else {
    const { error } = await auth.sb.from('doz_categories').insert({ slug, label, display_order: order });
    if (error) return { error: error.code === '23505' ? 'Kategori sa a deja egziste.' : error.message };
  }
  revalidatePath('/admin/doz');
  revalidatePath('/dashboard/reset-doz');
  return { ok: true };
}

export async function deleteDozCategory(categoryId: string): Promise<DozState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('doz_categories').delete().eq('id', categoryId);
  if (error) return { error: error.message };
  revalidatePath('/admin/doz');
  revalidatePath('/dashboard/reset-doz');
  return { ok: true };
}

// ── Image upload for the rich-text editor (public-assets bucket) ─────────────
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export type DozImageUploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadDozImage(fd: FormData): Promise<DozImageUploadResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const file = fd.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Pa gen fichye.' };
  if (!IMG_MIME.includes(file.type)) return { ok: false, error: 'Sèl JPG, PNG, WEBP, GIF.' };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: 'Imaj la twò gwo (maks 8 Mo).' };
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `doz-images/${auth.user.id}/${Date.now()}.${ext}`;
  const { error } = await auth.sb.storage.from('public-assets').upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: '3600' });
  if (error) return { ok: false, error: error.message };
  const { data } = auth.sb.storage.from('public-assets').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
