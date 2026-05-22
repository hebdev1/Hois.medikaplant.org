'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ResourceInsert = Database['public']['Tables']['resources']['Insert'];
type ResourceUpdate = Database['public']['Tables']['resources']['Update'];
type ResourceType = Database['public']['Enums']['resource_type'];
type Plan = Database['public']['Enums']['plan_type'];

const TYPE_VALUES: readonly ResourceType[] = ['pdf', 'video', 'audio'];
const PLAN_VALUES: readonly Plan[] = ['basic', 'premium', 'vip'];

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

// ─── Form reader / validator ────────────────────────────────────────────────

type FormInput = {
  title: string;
  description: string;
  type: string;
  category: string;
  plan_required: string;
  file_url: string;
  thumbnail_url: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  published: boolean;
};

function readForm(formData: FormData): FormInput {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const numOrNull = (k: string): number | null => {
    const raw = get(k);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  };
  return {
    title: get('title'),
    description: get('description'),
    type: get('type') || 'pdf',
    category: get('category'),
    plan_required: get('plan_required') || 'basic',
    file_url: get('file_url'),
    thumbnail_url: get('thumbnail_url'),
    duration_seconds: numOrNull('duration_seconds'),
    file_size_bytes: numOrNull('file_size_bytes'),
    published: formData.get('published') === 'on',
  };
}

function validate(
  input: FormInput
): { ok: true; data: ResourceInsert } | { ok: false; error: string } {
  if (input.title.length < 3) {
    return { ok: false, error: 'Tit la twò kout (omwen 3 karaktè).' };
  }
  if (input.title.length > 200) {
    return { ok: false, error: 'Tit la twò long (maks 200 karaktè).' };
  }
  if (input.description.length > 600) {
    return { ok: false, error: 'Deskripsyon an twò long (maks 600 karaktè).' };
  }
  if (!TYPE_VALUES.includes(input.type as ResourceType)) {
    return { ok: false, error: 'Tip resous la pa valid.' };
  }
  if (!PLAN_VALUES.includes(input.plan_required as Plan)) {
    return { ok: false, error: 'Plan pa valid.' };
  }
  if (!input.file_url) {
    return { ok: false, error: 'URL fichye a obligatwa.' };
  }
  if (!/^https?:\/\//i.test(input.file_url)) {
    return { ok: false, error: 'URL fichye dwe kòmanse pa http:// oswa https://' };
  }
  if (input.thumbnail_url && !/^https?:\/\//i.test(input.thumbnail_url)) {
    return {
      ok: false,
      error: 'URL miniature dwe kòmanse pa http:// oswa https://',
    };
  }

  return {
    ok: true,
    data: {
      title: input.title,
      description: input.description || null,
      type: input.type as ResourceType,
      category: input.category || null,
      plan_required: input.plan_required as Plan,
      file_url: input.file_url,
      thumbnail_url: input.thumbnail_url || null,
      duration_seconds: input.duration_seconds,
      file_size_bytes: input.file_size_bytes,
      published: input.published,
    } as ResourceInsert,
  };
}

export type AdminResourceState = { error?: string; ok?: boolean };

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createResource(
  _prev: AdminResourceState,
  formData: FormData
): Promise<AdminResourceState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readForm(formData);
  const v = validate(input);
  if (!v.ok) return { error: v.error };

  const insert: ResourceInsert = { ...v.data, created_by: auth.user.id };

  const { data, error } = await auth.supabase
    .from('resources')
    .insert(insert)
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/admin/resources');
  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard');
  redirect(`/admin/resources/${(data as { id: string }).id}?created=1`);
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateResource(
  resourceId: string,
  _prev: AdminResourceState,
  formData: FormData
): Promise<AdminResourceState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readForm(formData);
  const v = validate(input);
  if (!v.ok) return { error: v.error };

  const update: ResourceUpdate = v.data;

  const { error } = await auth.supabase
    .from('resources')
    .update(update)
    .eq('id', resourceId);
  if (error) return { error: error.message };

  revalidatePath('/admin/resources');
  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ─── Toggle published ───────────────────────────────────────────────────────

export async function toggleResourcePublished(
  resourceId: string
): Promise<{ ok: true; published: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.supabase
    .from('resources')
    .select('published')
    .eq('id', resourceId)
    .maybeSingle();
  const c = current as { published: boolean } | null;
  if (!c) return { ok: false, error: 'Resous la pa egziste.' };

  const next = !c.published;
  const { error } = await auth.supabase
    .from('resources')
    .update({ published: next })
    .eq('id', resourceId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/resources');
  revalidatePath('/dashboard/resources');
  return { ok: true, published: next };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteResource(
  resourceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/resources');
  revalidatePath('/dashboard/resources');
  return { ok: true };
}
