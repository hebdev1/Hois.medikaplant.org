'use server';

// Public Laboratwa contribution actions — unauthenticated by design. They run
// with the service-role client (no anon RLS on `contributions`), so the action
// validates + shapes every value and only ever writes a fresh 'draft' row.

import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit, clientIp } from '@/lib/rate-limit';

const BUCKET = 'public-assets';
const PREFIX = 'laboratwa-contributions';
const PUBLIC_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${PREFIX}/`;
const DEPTS = ['AR', 'CE', 'GA', 'NI', 'NO', 'NE', 'NW', 'OU', 'SU', 'SE'];
const s = (v: unknown, max = 400) => String(v ?? '').trim().slice(0, max);

export async function uploadLabPhoto(dataUrl: string): Promise<{ url?: string; error?: string }> {
  if (!rateLimit(`lab-upload:${clientIp()}`, 10, 60_000)) {
    return { error: 'Twòp tantativ. Tanpri tann yon ti moman anvan ou reeseye.' };
  }
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) return { error: 'Foto a pa nan yon fòma nou aksepte.' };
  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length === 0) return { error: 'Foto a vid.' };
  if (bytes.length > 6 * 1024 * 1024) return { error: 'Foto a twò gwo (maks 6 Mo).' };
  const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
  const path = `${PREFIX}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType: m[1], cacheControl: '3600', upsert: false,
  });
  if (error) {
    console.error('[lab] photo upload failed', error);
    return { error: 'Nou pa ka telechaje foto a kounye a. Reeseye pita.' };
  }
  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: publicUrl };
}

export type LabContribInput = {
  plant_id: string | null;
  local_name: string;
  region: string;
  body: string;
  photo_path: string | null;
};

export async function submitLabContribution(
  input: LabContribInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!rateLimit(`lab-submit:${clientIp()}`, 5, 60_000)) {
    return { ok: false, error: 'Twòp tantativ. Tanpri tann yon ti moman anvan ou reeseye.' };
  }
  const local_name = s(input.local_name, 160);
  const body = s(input.body, 2000);
  if (local_name.length < 2 && body.length < 2) {
    return { ok: false, error: 'Ekri omwen yon non lokal oswa yon nòt.' };
  }
  const region = DEPTS.includes(input.region) ? input.region : '';
  const photo =
    input.photo_path && input.photo_path.startsWith(PUBLIC_BASE) ? input.photo_path : null;
  const plant_id = input.plant_id ? s(input.plant_id, 40) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const { error } = await sb.from('contributions').insert({
    plant_id, local_name: local_name || null, region: region || null,
    body: body || null, photo_path: photo, status: 'draft',
  });
  if (error) {
    console.error('[lab] contribution insert failed', error);
    return { ok: false, error: 'Nou pa ka anrejistre kontribisyon an kounye a. Reeseye pita.' };
  }
  return { ok: true };
}
