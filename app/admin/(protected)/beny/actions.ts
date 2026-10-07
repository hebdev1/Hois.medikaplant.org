'use server';

// CRUD for "Beny Spirityèl": the teaser row (spiritual_baths) and its
// Melis-only recipe (spiritual_bath_recipes, 1-to-1). Mirrors the Doz admin.
// Requires role='admin' + the manage_guides capability.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';
import { hasCapability, type AdminRole } from '../admin-nav-config';

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
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const row = profile as { role: string; admin_role: AdminRole | null } | null;
  if (row?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  if (!hasCapability(row.admin_role, 'manage_guides')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou sa.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

const visibleLen = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().length;

function revalidateBath(slug?: string) {
  revalidatePath('/admin/beny');
  revalidatePath('/dashboard/beny-spirityel');
  if (slug) revalidatePath(`/dashboard/beny-spirityel/${slug}`);
}

export type BathState = { error?: string; ok?: boolean; id?: string };

function readForm(fd: FormData) {
  const get = (k: string) => (fd.get(k)?.toString() ?? '').trim();
  return {
    title: get('title'),
    slug: get('slug'),
    intention: get('intention') || null,
    excerpt: get('excerpt') || null,
    cover_image_url: get('cover_image_url') || null,
    display_order: Math.max(0, Math.floor(Number(get('display_order')) || 0)),
    published: fd.get('published') === 'on',
    // One ingredient per line.
    ingredients: get('ingredients')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
    preparation_html: get('preparation_html'),
    usage_html: get('usage_html'),
    cautions_html: get('cautions_html'),
    video_url: get('video_url') || null,
  };
}

async function saveBath(bathId: string | null, fd: FormData): Promise<BathState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const input = readForm(fd);
  if (input.title.length < 3) return { error: 'Tit la twò kout.' };
  const slug = slugify(input.slug || input.title);
  if (slug.length < 3) return { error: 'Slug la pa valid.' };
  if (input.video_url && !/^https?:\/\//i.test(input.video_url)) {
    return { error: 'Lyen videyo a dwe kòmanse ak https://' };
  }
  // A draft can be partial; a published bath needs its preparation.
  if (input.published && visibleLen(input.preparation_html) < 10) {
    return { error: 'Ajoute preparasyon an anvan ou pibliye beny lan.' };
  }

  const now = new Date().toISOString();
  let publishedAt: string | null = null;
  if (bathId && input.published) {
    const { data: existing } = await auth.sb
      .from('spiritual_baths')
      .select('published_at')
      .eq('id', bathId)
      .maybeSingle();
    publishedAt = (existing as { published_at: string | null } | null)?.published_at ?? now;
  } else if (input.published) {
    publishedAt = now;
  }

  const bath = {
    slug,
    title: input.title,
    intention: input.intention,
    excerpt: input.excerpt,
    cover_image_url: input.cover_image_url,
    display_order: input.display_order,
    published: input.published,
    published_at: publishedAt,
  };
  const recipe = {
    ingredients: input.ingredients,
    preparation_html: input.preparation_html || null,
    usage_html: input.usage_html || null,
    cautions_html: input.cautions_html || null,
    video_url: input.video_url,
    updated_at: now,
  };

  let id = bathId;
  if (id) {
    const { error } = await auth.sb
      .from('spiritual_baths')
      .update({ ...bath, updated_at: now })
      .eq('id', id);
    if (error) return { error: error.code === '23505' ? 'Slug sa a deja itilize.' : error.message };
  } else {
    const { data, error } = await auth.sb
      .from('spiritual_baths')
      .insert({ ...bath, created_by: auth.user.id })
      .select('id')
      .single();
    if (error || !data) {
      return { error: error?.code === '23505' ? 'Slug sa a deja itilize.' : (error?.message ?? 'Erè.') };
    }
    id = (data as { id: string }).id;
  }

  const { error: recipeError } = await auth.sb
    .from('spiritual_bath_recipes')
    .upsert({ bath_id: id, ...recipe }, { onConflict: 'bath_id' });
  if (recipeError) return { error: recipeError.message };

  await logAudit(auth.sb, auth.user, {
    action: bathId ? 'update' : 'create',
    entity: 'bath',
    entity_id: id,
    summary: input.title,
  });
  revalidateBath(slug);
  if (!bathId) redirect(`/admin/beny/${id}?created=1`);
  return { ok: true, id: id ?? undefined };
}

export async function createBath(_p: BathState, fd: FormData) {
  return saveBath(null, fd);
}
export async function updateBath(bathId: string, _p: BathState, fd: FormData) {
  return saveBath(bathId, fd);
}

export async function deleteBath(bathId: string): Promise<BathState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  // The recipe row goes with it (on delete cascade).
  const { error } = await auth.sb.from('spiritual_baths').delete().eq('id', bathId);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'bath', entity_id: bathId });
  revalidateBath();
  return { ok: true };
}

export async function toggleBathPublished(bathId: string): Promise<BathState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const [{ data: bathRaw }, { data: recipeRaw }] = await Promise.all([
    auth.sb.from('spiritual_baths').select('slug, title, published, published_at').eq('id', bathId).maybeSingle(),
    auth.sb.from('spiritual_bath_recipes').select('preparation_html').eq('bath_id', bathId).maybeSingle(),
  ]);
  const bath = bathRaw as { slug: string; title: string; published: boolean; published_at: string | null } | null;
  if (!bath) return { error: 'Beny lan pa egziste.' };
  const next = !bath.published;
  const preparation = (recipeRaw as { preparation_html: string | null } | null)?.preparation_html ?? '';
  if (next && visibleLen(preparation) < 10) {
    return { error: 'Ajoute preparasyon an anvan ou pibliye beny lan.' };
  }
  const now = new Date().toISOString();
  const { error } = await auth.sb
    .from('spiritual_baths')
    .update({ published: next, published_at: next ? (bath.published_at ?? now) : null, updated_at: now })
    .eq('id', bathId);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, {
    action: next ? 'publish' : 'unpublish',
    entity: 'bath',
    entity_id: bathId,
    summary: bath.title,
  });
  revalidateBath(bath.slug);
  return { ok: true };
}

// ── Image upload: cover photo + images inside the rich-text fields ───────────
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export type BathImageUploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadBathImage(fd: FormData): Promise<BathImageUploadResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const file = fd.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Pa gen fichye.' };
  if (!IMG_MIME.includes(file.type)) return { ok: false, error: 'Sèl JPG, PNG, WEBP, GIF.' };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: 'Imaj la twò gwo (maks 8 Mo).' };
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `beny-images/${auth.user.id}/${Date.now()}.${ext}`;
  const { error } = await auth.sb.storage.from('public-assets').upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: '3600' });
  if (error) return { ok: false, error: error.message };
  const { data } = auth.sb.storage.from('public-assets').getPublicUrl(path);
  await logAudit(auth.sb, auth.user, { action: 'upload', entity: 'bath', summary: path });
  return { ok: true, url: data.publicUrl };
}
