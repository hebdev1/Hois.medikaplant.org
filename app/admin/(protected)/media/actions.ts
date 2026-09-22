'use server';

// CMS Media Library server actions. Binary files live in the existing
// `public-assets` Supabase Storage bucket (same one the homepage-image tool
// uses); metadata + public URL are recorded in public.media_assets. Every
// action re-checks the admin session server-side.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/cms/audit';
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
  if (row?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  if (!hasCapability(row.admin_role, 'manage_resources')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou sa.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, sb: supabase as any };
}

// Matches the public-assets bucket's own allowed types (SVG excluded so we
// never serve script-bearing markup from the assets domain).
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const BUCKET = 'public-assets';

export type MediaState = { ok?: boolean; error?: string; uploaded?: number };

/** Upload one or more images into a folder (or the root when folderId null). */
export async function uploadMedia(
  folderId: string | null,
  formData: FormData
): Promise<MediaState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const files = formData
    .getAll('files')
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: 'Chwazi omwen yon imaj.' };

  let uploaded = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (!IMG_MIME.includes(file.type)) {
      errors.push(`${file.name}: sèl JPG / PNG / WEBP`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: twò gwo (maks 8 Mo)`);
      continue;
    }
    const ext =
      file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await auth.sb.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
    if (upErr) {
      errors.push(`${file.name}: ${upErr.message}`);
      continue;
    }

    const {
      data: { publicUrl },
    } = auth.sb.storage.from(BUCKET).getPublicUrl(path);

    const { error: insErr } = await auth.sb.from('media_assets').insert({
      storage_path: path,
      url: publicUrl,
      filename: file.name,
      title: file.name.replace(/\.[^.]+$/, ''),
      mime_type: file.type,
      bytes: file.size,
      folder_id: folderId,
      uploaded_by: auth.user.id,
    });
    if (insErr) {
      // best-effort cleanup of the orphaned object
      await auth.sb.storage.from(BUCKET).remove([path]);
      errors.push(`${file.name}: ${insErr.message}`);
      continue;
    }
    uploaded++;
  }

  if (uploaded > 0) {
    await logAudit(auth.sb, auth.user, { action: 'upload', entity: 'media', summary: `${uploaded} imaj` });
  }
  revalidatePath('/admin/media');
  if (uploaded === 0) return { error: errors[0] ?? 'Echwe.' };
  return { ok: true, uploaded, error: errors.length ? errors.join(' · ') : undefined };
}

/** Edit an asset's metadata (title, alt text, caption…) or move it. */
export async function updateMediaAsset(
  id: string,
  patch: {
    title?: string;
    alt_text?: string;
    caption?: string;
    description?: string;
    credit?: string;
    folder_id?: string | null;
  }
): Promise<MediaState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb
    .from('media_assets')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/media');
  return { ok: true };
}

/** Delete an asset (removes the storage object too). */
export async function deleteMediaAsset(id: string): Promise<MediaState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { data: row } = await auth.sb
    .from('media_assets')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (row?.storage_path) {
    await auth.sb.storage.from(BUCKET).remove([row.storage_path]);
  }
  const { error } = await auth.sb.from('media_assets').delete().eq('id', id);
  if (error) return { error: error.message };
  await logAudit(auth.sb, auth.user, { action: 'delete', entity: 'media', entity_id: id });
  revalidatePath('/admin/media');
  return { ok: true };
}

/** Create a new folder. */
export async function createMediaFolder(name: string): Promise<MediaState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const clean = name.trim();
  if (!clean) return { error: 'Bay yon non pou dosye a.' };
  const slug =
    clean
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `dosye-${Date.now()}`;
  const { error } = await auth.sb.from('media_folders').insert({ name: clean, slug });
  if (error) return { error: error.message };
  revalidatePath('/admin/media');
  return { ok: true };
}

export type MediaAssetLite = {
  id: string;
  url: string;
  title: string | null;
  alt_text: string | null;
};

/**
 * Lightweight asset list for the in-editor Media Picker (block editor image
 * block + rich-text image insert). Newest first, capped so the picker stays
 * snappy. Admin-gated like every other action here.
 */
export async function listMediaAssets(): Promise<MediaAssetLite[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];
  const { data } = await auth.sb
    .from('media_assets')
    .select('id, url, title, alt_text')
    .order('created_at', { ascending: false })
    .limit(200);
  return (data ?? []) as MediaAssetLite[];
}
