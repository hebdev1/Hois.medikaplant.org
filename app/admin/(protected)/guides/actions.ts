'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { hasCapability, type AdminRole } from '../admin-nav-config';

type GuideInsert = Database['public']['Tables']['guides']['Insert'];
type GuideUpdate = Database['public']['Tables']['guides']['Update'];
type GuideRow = Database['public']['Tables']['guides']['Row'];
type GuideArt = Database['public']['Enums']['guide_art'];
type Plan = Database['public']['Enums']['plan_type'];

const ART_VALUES: readonly GuideArt[] = ['leaf', 'sprout', 'droplet', 'sparkle', 'tree', 'flower'];
const PLAN_VALUES: readonly Plan[] = ['basic', 'premium', 'vip'];
const LANG_VALUES = ['ht', 'fr', 'en'] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
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
  if (row?.role !== 'admin') return { ok: false as const, error: 'Aksè entèdi.' };
  if (!hasCapability(row.admin_role, 'manage_guides')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere gid yo.' };
  }
  return { ok: true as const, user, supabase };
}

type FormInput = {
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  category_id: string | null;
  tag: string;
  accent_color: string;
  art: string;
  read_minutes: number;
  language: string;
  plan_required: string;
  featured: boolean;
  published: boolean;
  author_name: string;
  author_role: string;
  author_avatar_url: string;
  cover_image_url: string;
};

function readForm(formData: FormData): FormInput {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  return {
    title: get('title'),
    slug: get('slug'),
    excerpt: get('excerpt'),
    body_html: get('body_html'),
    category_id: get('category_id') || null,
    tag: get('tag'),
    accent_color: get('accent_color') || '#5A9138',
    art: get('art') || 'leaf',
    read_minutes: Math.max(1, Math.min(120, Number(get('read_minutes')) || 5)),
    language: get('language') || 'ht',
    plan_required: get('plan_required') || 'basic',
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
    author_name: get('author_name') || 'Hoïs Inivèsite',
    author_role: get('author_role'),
    author_avatar_url: get('author_avatar_url'),
    cover_image_url: get('cover_image_url'),
  };
}

// Strip HTML tags + collapse whitespace so we can length-check the
// actual visible text instead of the angle-bracket scaffolding.
function visibleTextLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

function validate(input: FormInput): { ok: true; data: GuideInsert } | { ok: false; error: string } {
  if (input.title.length < 4) return { ok: false, error: 'Tit la twò kout (minimòm 4 karaktè).' };
  if (input.excerpt.length < 10) return { ok: false, error: 'Ekstrè a twò kout (minimòm 10 karaktè).' };
  if (visibleTextLength(input.body_html) < 20) {
    return { ok: false, error: 'Kontni an twò kout (minimòm 20 karaktè vizib).' };
  }
  const slug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (slug.length < 3) return { ok: false, error: 'Slug la pa valid.' };
  if (!ART_VALUES.includes(input.art as GuideArt)) {
    return { ok: false, error: 'Glif (art) pa valid.' };
  }
  if (!PLAN_VALUES.includes(input.plan_required as Plan)) {
    return { ok: false, error: 'Plan pa valid.' };
  }
  if (!LANG_VALUES.includes(input.language as (typeof LANG_VALUES)[number])) {
    return { ok: false, error: 'Lang pa valid.' };
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.accent_color)) {
    return { ok: false, error: 'Koulè aksan an pa valid (egz: #5A9138).' };
  }
  return {
    ok: true,
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      // Keep body_markdown filled with a plain-text dump of the rich
      // body so DB consumers that only know about that column (FDW
      // queries, full-text search seed) don't go empty. The visible
      // rendering on /dashboard/guides/[slug] uses body_html when set.
      body_markdown: input.body_html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      body_html: input.body_html,
      category_id: input.category_id,
      tag: input.tag || null,
      accent_color: input.accent_color,
      art: input.art as GuideArt,
      read_minutes: input.read_minutes,
      language: input.language,
      plan_required: input.plan_required as Plan,
      featured: input.featured,
      published: input.published,
      author_name: input.author_name,
      author_role: input.author_role || null,
      author_avatar_url: input.author_avatar_url || null,
      cover_image_url: input.cover_image_url || null,
    } as GuideInsert,
  };
}

export type AdminGuideState = { error?: string; ok?: boolean };

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createGuide(
  _prev: AdminGuideState,
  formData: FormData
): Promise<AdminGuideState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readForm(formData);
  const v = validate(input);
  if (!v.ok) return { error: v.error };

  // Stamp created_by for traceability
  const insert: GuideInsert = { ...v.data, created_by: auth.user.id };

  const { data, error } = await auth.supabase
    .from('guides')
    .insert(insert)
    .select('id, slug')
    .single();
  if (error || !data) {
    if (error?.code === '23505') {
      return { error: `Yon atik ak slug "${insert.slug}" deja egziste.` };
    }
    return { error: error?.message ?? 'Erè inkoni.' };
  }

  revalidatePath('/admin/guides');
  revalidatePath('/dashboard/guides');
  redirect(`/admin/guides/${(data as { id: string }).id}?created=1`);
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateGuide(
  guideId: string,
  _prev: AdminGuideState,
  formData: FormData
): Promise<AdminGuideState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readForm(formData);
  const v = validate(input);
  if (!v.ok) return { error: v.error };

  const update: GuideUpdate = v.data;

  const { error } = await auth.supabase
    .from('guides')
    .update(update)
    .eq('id', guideId);
  if (error) {
    if (error.code === '23505') {
      return { error: 'Yon lòt atik deja itilize slug sa a.' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/guides');
  revalidatePath('/dashboard/guides');
  revalidatePath(`/dashboard/guides/${update.slug}`);
  return { ok: true };
}

// ─── Toggle published ───────────────────────────────────────────────────────

export async function togglePublished(
  guideId: string
): Promise<{ ok: true; published: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.supabase
    .from('guides')
    .select('published')
    .eq('id', guideId)
    .maybeSingle();
  const c = current as { published: boolean } | null;
  if (!c) return { ok: false, error: 'Atik la pa egziste.' };

  const next = !c.published;
  const { error } = await auth.supabase
    .from('guides')
    .update({ published: next })
    .eq('id', guideId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/guides');
  revalidatePath('/dashboard/guides');
  return { ok: true, published: next };
}

// ─── Toggle featured ────────────────────────────────────────────────────────

export async function toggleFeatured(
  guideId: string
): Promise<{ ok: true; featured: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Only one featured at a time — un-feature others first
  const { data: current } = await auth.supabase
    .from('guides')
    .select('featured')
    .eq('id', guideId)
    .maybeSingle();
  const c = current as { featured: boolean } | null;
  if (!c) return { ok: false, error: 'Atik la pa egziste.' };

  const next = !c.featured;

  if (next) {
    await auth.supabase
      .from('guides')
      .update({ featured: false })
      .eq('featured', true)
      .neq('id', guideId);
  }

  const { error } = await auth.supabase
    .from('guides')
    .update({ featured: next })
    .eq('id', guideId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/guides');
  revalidatePath('/dashboard/guides');
  return { ok: true, featured: next };
}

// ─── Image upload for the rich-text editor ─────────────────────────────────
//
// Admin pastes the returned public URL into Tiptap (via setImage). Files
// land in the same public-assets bucket the avatar uploader uses, scoped
// to a `guide-images/<adminId>/<ts>.<ext>` path so we can sweep them per
// admin if we ever need to. The bucket is public so the URL works in
// emails / RSS feeds / archived PDFs without re-signing.

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export type GuideImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadGuideImage(
  formData: FormData
): Promise<GuideImageUploadResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'Pa gen fichye chwazi.' };
  }
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    return { ok: false, error: 'Sèl JPG, PNG, WEBP, ak GIF otorize.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Imaj la twò gwo (maks 8 Mo).' };
  }

  const ext =
    file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/gif'
          ? 'gif'
          : 'webp';
  const objectPath = `guide-images/${auth.user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await auth.supabase.storage
    .from('public-assets')
    .upload(objectPath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from('public-assets').getPublicUrl(objectPath);

  return { ok: true, url: publicUrl };
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteGuide(
  guideId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('guides')
    .delete()
    .eq('id', guideId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/guides');
  revalidatePath('/dashboard/guides');
  return { ok: true };
}

// ─── Bulk delete ─────────────────────────────────────────────────────────────
// Delete many guides in one round-trip via `.in()`. Returns the number
// actually removed so the UI can report it. Capped at 200 ids per call
// as a sanity guard against a runaway request.

export async function bulkDeleteGuides(
  guideIds: string[]
): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const ids = Array.from(new Set(guideIds.filter(Boolean))).slice(0, 200);
  if (ids.length === 0) {
    return { ok: false, error: 'Pa gen atik chwazi.' };
  }

  const { data, error } = await auth.supabase
    .from('guides')
    .delete()
    .in('id', ids)
    .select('id');
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/guides');
  revalidatePath('/dashboard/guides');
  return { ok: true, deleted: (data as { id: string }[] | null)?.length ?? 0 };
}
