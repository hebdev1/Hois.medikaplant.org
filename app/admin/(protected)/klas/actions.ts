'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';

// The courses + course_categories + klas_page_config tables are too new
// to be in types/database.ts yet — every read/write here goes through a
// loosely-typed Supabase handle (`sb`). Replace with generated types
// on the next regenerate.

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
  if (!hasCapability(row.admin_role, 'manage_courses')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere klas yo.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, supabase, sb: supabase as any };
}

// ─── Slug helper (same shape as guides) ────────────────────────────────────

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─── Categories ─────────────────────────────────────────────────────────────

const ICON_VALUES = [
  'leaf',
  'sprout',
  'mountain',
  'heart',
  'activity',
  'graduation-cap',
  'book-open',
  'video',
  'users',
  'star',
] as const;

export type CategoryState = { error?: string; ok?: boolean };

export async function saveCategory(
  id: string | null,
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const title = get('title');
  const body = get('body');
  const rawSlug = get('slug');
  const icon = get('icon') || 'leaf';
  const tone = get('tone') || 'from-brand-500 to-brand-700';
  const order = Math.max(0, Number(get('display_order')) || 0);
  const active = formData.get('active') === 'on';

  if (title.length < 2) return { error: 'Tit kategori a twò kout.' };
  if (body.length < 5) return { error: 'Deskripsyon kategori a twò kout.' };
  if (!ICON_VALUES.includes(icon as (typeof ICON_VALUES)[number])) {
    return { error: 'Ikòn pa valid.' };
  }
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  if (slug.length < 2) return { error: 'Slug la pa valid.' };

  const payload = { slug, title, body, icon, tone, display_order: order, active };

  const { error } = id
    ? await auth.sb.from('course_categories').update(payload).eq('id', id)
    : await auth.sb.from('course_categories').insert(payload);
  if (error) {
    if (String(error.code) === '23505') {
      return { error: 'Yon kategori ak slug sa a deja egziste.' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/klas');
  revalidatePath('/klas');
  return { ok: true };
}

export async function deleteCategory(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb.from('course_categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/klas');
  revalidatePath('/klas');
  return { ok: true };
}

// ─── Courses ────────────────────────────────────────────────────────────────

const LEVEL_VALUES = ['debutan', 'entermedye', 'avanse', 'tout_nivo'] as const;
const FORMAT_VALUES = ['video', 'live_zoom', 'hybrid'] as const;
const PLAN_VALUES = ['basic', 'premium', 'vip'] as const;
const LANG_VALUES = ['ht', 'fr', 'en'] as const;

export type CourseState = { error?: string; ok?: boolean; id?: string };

function readCourseForm(formData: FormData) {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const tags = get('tags')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
  const priceRaw = get('price_cents');
  return {
    title: get('title'),
    slug: get('slug'),
    description: get('description'),
    body_html: get('body_html') || null,
    cover_image_url: get('cover_image_url') || null,
    instructor_name: get('instructor_name') || 'Hoïs Inivèsite',
    instructor_role: get('instructor_role') || null,
    instructor_avatar_url: get('instructor_avatar_url') || null,
    duration_text: get('duration_text') || null,
    level: get('level') || 'tout_nivo',
    format: get('format') || 'video',
    zoom_url: get('zoom_url') || null,
    zoom_schedule_text: get('zoom_schedule_text') || null,
    student_count_text: get('student_count_text') || null,
    rating: Math.max(0, Math.min(5, Number(get('rating')) || 5)),
    price_cents: priceRaw ? Math.max(0, Math.floor(Number(priceRaw))) : null,
    plan_required: get('plan_required') || 'basic',
    category_id: get('category_id') || null,
    language: get('language') || 'ht',
    featured: formData.get('featured') === 'on',
    active: formData.get('active') === 'on',
    display_order: Math.max(0, Number(get('display_order')) || 0),
    tags,
  };
}

export async function saveCourse(
  id: string | null,
  _prev: CourseState,
  formData: FormData
): Promise<CourseState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readCourseForm(formData);

  if (input.title.length < 4) return { error: 'Tit klas la twò kout.' };
  if (input.description.length < 10) return { error: 'Deskripsyon an twò kout.' };
  if (!LEVEL_VALUES.includes(input.level as (typeof LEVEL_VALUES)[number])) {
    return { error: 'Nivo pa valid.' };
  }
  if (!FORMAT_VALUES.includes(input.format as (typeof FORMAT_VALUES)[number])) {
    return { error: 'Fòma pa valid.' };
  }
  if (!PLAN_VALUES.includes(input.plan_required as (typeof PLAN_VALUES)[number])) {
    return { error: 'Plan pa valid.' };
  }
  if (!LANG_VALUES.includes(input.language as (typeof LANG_VALUES)[number])) {
    return { error: 'Lang pa valid.' };
  }
  if (input.format !== 'video' && input.zoom_url && !/^https?:\/\//i.test(input.zoom_url)) {
    return { error: 'Lyen Zoom la dwe kòmanse pa https://' };
  }
  const slug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (slug.length < 3) return { error: 'Slug la pa valid.' };

  // zoom_schedule comes in as free-text (e.g. "Chak Madi 7pm"); we store
  // it as a one-key JSON so future structured fields can drop in without
  // a schema change.
  const zoom_schedule = input.zoom_schedule_text
    ? { text: input.zoom_schedule_text }
    : null;

  const payload = {
    title: input.title,
    slug,
    description: input.description,
    body_html: input.body_html,
    cover_image_url: input.cover_image_url,
    instructor_name: input.instructor_name,
    instructor_role: input.instructor_role,
    instructor_avatar_url: input.instructor_avatar_url,
    duration_text: input.duration_text,
    level: input.level,
    format: input.format,
    zoom_url: input.zoom_url,
    zoom_schedule,
    student_count_text: input.student_count_text,
    rating: input.rating,
    price_cents: input.price_cents,
    plan_required: input.plan_required,
    category_id: input.category_id,
    language: input.language,
    featured: input.featured,
    active: input.active,
    display_order: input.display_order,
    tags: input.tags,
  };

  if (id) {
    const { error } = await auth.sb.from('courses').update(payload).eq('id', id);
    if (error) {
      if (String(error.code) === '23505') return { error: 'Slug deja egziste.' };
      return { error: error.message };
    }
    revalidatePath('/admin/klas');
    revalidatePath('/klas');
    return { ok: true, id };
  }

  const { data, error } = await auth.sb
    .from('courses')
    .insert({ ...payload, created_by: auth.user.id })
    .select('id')
    .single();
  if (error || !data) {
    if (String(error?.code) === '23505') return { error: 'Slug deja egziste.' };
    return { error: error?.message ?? 'Erè inkoni.' };
  }
  revalidatePath('/admin/klas');
  revalidatePath('/klas');
  redirect(`/admin/klas/${(data as { id: string }).id}?created=1`);
}

export async function toggleCourseFlag(
  id: string,
  field: 'featured' | 'active'
): Promise<{ ok: true; value: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.sb
    .from('courses')
    .select(field)
    .eq('id', id)
    .maybeSingle();
  const c = current as Record<string, boolean> | null;
  if (!c) return { ok: false, error: 'Klas la pa egziste.' };

  const next = !c[field];
  const { error } = await auth.sb.from('courses').update({ [field]: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/klas');
  revalidatePath('/klas');
  return { ok: true, value: next };
}

export async function deleteCourse(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb.from('courses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/klas');
  revalidatePath('/klas');
  return { ok: true };
}

// ─── Course modules ────────────────────────────────────────────────────────

export type ModuleState = { error?: string; ok?: boolean; id?: string };

function readModuleForm(formData: FormData) {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  // resource_links arrive as one-per-line "Label | https://url" pairs.
  // Anything that doesn't match the pipe-separated shape is skipped.
  const linksText = get('resource_links');
  const resource_links = linksText
    ? linksText
        .split('\n')
        .map((line) => {
          const [label, url] = line.split('|').map((s) => s.trim());
          if (!label || !url || !/^https?:\/\//i.test(url)) return null;
          return { label, url };
        })
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return {
    title: get('title'),
    description: get('description') || null,
    duration_text: get('duration_text') || null,
    video_url: get('video_url') || null,
    resource_links: resource_links.length > 0 ? resource_links : null,
    preview: formData.get('preview') === 'on',
    display_order: Math.max(0, Number(get('display_order')) || 0),
  };
}

export async function saveModule(
  courseId: string,
  moduleId: string | null,
  _prev: ModuleState,
  formData: FormData
): Promise<ModuleState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readModuleForm(formData);

  if (input.title.length < 2) return { error: 'Tit modil la twò kout.' };
  if (input.video_url && !/^https?:\/\//i.test(input.video_url)) {
    return { error: 'Lyen videyo dwe kòmanse pa https://' };
  }

  const payload = { ...input, course_id: courseId };

  if (moduleId) {
    const { error } = await auth.sb
      .from('course_modules')
      .update(payload)
      .eq('id', moduleId);
    if (error) return { error: error.message };
    revalidatePath(`/admin/klas/${courseId}`);
    revalidatePath('/klas');
    return { ok: true, id: moduleId };
  }

  // For a brand-new module, auto-append at the end if the form didn't
  // pick a display_order — admins shouldn't have to count rows.
  const orderToUse = input.display_order > 0
    ? input.display_order
    : await nextModuleOrder(auth.sb, courseId);

  const { data, error } = await auth.sb
    .from('course_modules')
    .insert({ ...payload, display_order: orderToUse })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };
  revalidatePath(`/admin/klas/${courseId}`);
  revalidatePath('/klas');
  return { ok: true, id: (data as { id: string }).id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function nextModuleOrder(sb: any, courseId: string): Promise<number> {
  const { data } = await sb
    .from('course_modules')
    .select('display_order')
    .eq('course_id', courseId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const top = (data as { display_order: number } | null)?.display_order ?? 0;
  return top + 1;
}

export async function deleteModule(
  courseId: string,
  moduleId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const { error } = await auth.sb.from('course_modules').delete().eq('id', moduleId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/klas/${courseId}`);
  revalidatePath('/klas');
  return { ok: true };
}

export async function reorderModule(
  courseId: string,
  moduleId: string,
  direction: 'up' | 'down'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Fetch the full ordered list once so we can swap with the neighbor
  // by id without a second query per row.
  const { data: rowsRaw } = await auth.sb
    .from('course_modules')
    .select('id, display_order')
    .eq('course_id', courseId)
    .order('display_order', { ascending: true });
  const rows = (rowsRaw ?? []) as Array<{ id: string; display_order: number }>;

  const idx = rows.findIndex((r) => r.id === moduleId);
  if (idx === -1) return { ok: false, error: 'Modil la pa twouve.' };

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) {
    return { ok: true }; // already at the edge — no-op
  }

  const a = rows[idx];
  const b = rows[swapWith];

  // Swap display_orders with two updates. Race-safe enough at admin
  // scale — only one operator edits a course at a time.
  await auth.sb
    .from('course_modules')
    .update({ display_order: b.display_order })
    .eq('id', a.id);
  await auth.sb
    .from('course_modules')
    .update({ display_order: a.display_order })
    .eq('id', b.id);

  revalidatePath(`/admin/klas/${courseId}`);
  revalidatePath('/klas');
  return { ok: true };
}

// ─── Page config (singleton) ────────────────────────────────────────────────

export type PageConfigState = { error?: string; ok?: boolean };

export async function savePageConfig(
  _prev: PageConfigState,
  formData: FormData
): Promise<PageConfigState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();

  // Benefits arrive as one-per-line in a textarea; trim+drop blanks so
  // the array doesn't pick up trailing newlines.
  const benefits = get('benefits')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  // FAQs + formats are JSON; if parsing fails we surface a friendly
  // error instead of letting Postgres scream about jsonb syntax.
  let faqs: unknown = [];
  let formats: unknown = [];
  try {
    faqs = JSON.parse(get('faqs') || '[]');
  } catch {
    return { error: 'FAQ JSON pa valid.' };
  }
  try {
    formats = JSON.parse(get('formats') || '[]');
  } catch {
    return { error: 'Fòma JSON pa valid.' };
  }

  const payload = {
    id: 1,
    hero_eyebrow: get('hero_eyebrow') || null,
    hero_title: get('hero_title') || null,
    hero_subtitle: get('hero_subtitle') || null,
    hero_cta_label: get('hero_cta_label') || null,
    hero_cta_href: get('hero_cta_href') || null,
    hero_image_url: get('hero_image_url') || null,
    stat_courses_label: get('stat_courses_label') || null,
    stat_categories_label: get('stat_categories_label') || null,
    stat_rating_label: get('stat_rating_label') || null,
    stat_rating_value: Math.max(0, Math.min(5, Number(get('stat_rating_value')) || 5)),
    benefits,
    faqs,
    formats,
    cta_title: get('cta_title') || null,
    cta_subtitle: get('cta_subtitle') || null,
    updated_by: auth.user.id,
  };

  const { error } = await auth.sb
    .from('klas_page_config')
    .upsert(payload, { onConflict: 'id' });
  if (error) return { error: error.message };

  revalidatePath('/admin/klas');
  revalidatePath('/klas');
  return { ok: true };
}
