'use server';

// Admin-managed homepage graphics. Each slot is overridden independently;
// deleting an override restores the default shipped in code, so the site can
// never end up with a missing image.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

// Revalidate every surface that reads site images.
function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/admin/imaj');
}

// Kept in sync with the public-assets bucket's own allowed_mime_types /
// file_size_limit (10 Mo) — SVG is deliberately excluded so we never serve
// script-bearing markup from the assets domain.
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

export type ImgState = { ok?: boolean; error?: string; url?: string };

/** Upload a replacement for one slot and record the override. */
export async function uploadSiteImage(
  key: string,
  formData: FormData
): Promise<ImgState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Chwazi yon imaj.' };
  }
  if (!IMG_MIME.includes(file.type)) {
    return { error: 'Sèl JPG, PNG oswa WEBP otorize.' };
  }
  if (file.size > MAX_BYTES) return { error: 'Imaj la twò gwo (maks 8 Mo).' };

  const ext =
    file.type === 'image/png' ? 'png'
    : file.type === 'image/webp' ? 'webp'
    : 'jpg';
  const path = `site-images/${key}-${Date.now()}.${ext}`;

  const { error: upErr } = await auth.sb.storage
    .from('public-assets')
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) return { error: upErr.message };

  const {
    data: { publicUrl },
  } = auth.sb.storage.from('public-assets').getPublicUrl(path);

  const { error } = await auth.sb.from('site_images').upsert(
    { key, url: publicUrl, updated_at: new Date().toISOString(), updated_by: auth.user.id },
    { onConflict: 'key' }
  );
  if (error) return { error: error.message };

  revalidateAll();
  return { ok: true, url: publicUrl };
}

/** Point a slot at an external URL instead of uploading. */
export async function setSiteImageUrl(key: string, url: string): Promise<ImgState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!/^https:\/\//i.test(url)) return { error: 'Lyen an dwe kòmanse pa https://' };

  const { error } = await auth.sb.from('site_images').upsert(
    { key, url, updated_at: new Date().toISOString(), updated_by: auth.user.id },
    { onConflict: 'key' }
  );
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true, url };
}

/** Drop the override so the slot falls back to the shipped default. */
export async function resetSiteImage(key: string): Promise<ImgState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  const { error } = await auth.sb.from('site_images').delete().eq('key', key);
  if (error) return { error: error.message };
  revalidateAll();
  return { ok: true };
}
