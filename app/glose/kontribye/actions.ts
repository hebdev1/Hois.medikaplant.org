'use server';

// Public glossary-contribution actions. These are intentionally UNAUTHENTICATED
// — anyone visiting /glose/kontribye can submit. They run with the service-role
// client (there is no anon RLS policy on glossary_contributions), so the action
// itself is the gatekeeper: it validates and shapes every value, caps sizes,
// and only ever writes a fresh 'nouvo' row. A curator approves it later.

import { createServiceClient } from '@/lib/supabase/service';
import type { ContributionInput } from './types';

const BUCKET = 'public-assets';
const PREFIX = 'glose-contributions';
const PUBLIC_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${PREFIX}/`;

const KINDS = ['lot-non', 'diferan', 'koreksyon'];
const CONFIRM = ['wi', 'non', 'pa-si'];
const SOURCES = ['mwen-menm', 'fanmi', 'tande', 'pratikan'];
const DEPTS = ['AR', 'CE', 'GA', 'NI', 'NO', 'NE', 'NW', 'OU', 'SU', 'SE'];

/**
 * Upload one already-reduced photo (a data: URL produced client-side, EXIF
 * stripped by drawing to a canvas) to Storage. Returns its public URL.
 * One photo per call keeps the payload small and the flow responsive.
 */
export async function uploadContributionPhoto(
  dataUrl: string
): Promise<{ url?: string; error?: string }> {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl || ''
  );
  if (!m) return { error: 'Foto a pa nan yon fòma nou aksepte.' };
  const mime = m[1];
  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length === 0) return { error: 'Foto a vid.' };
  if (bytes.length > 6 * 1024 * 1024) return { error: 'Foto a twò gwo (maks 6 Mo).' };

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${PREFIX}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, cacheControl: '3600', upsert: false });
  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: publicUrl };
}

const s = (v: unknown, max = 400) => String(v ?? '').trim().slice(0, max);

export async function submitContribution(
  input: ContributionInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const kind = KINDS.includes(input.kind) ? input.kind : '';
  if (!kind) return { ok: false, error: 'Chwazi yon kalite enfòmasyon.' };

  const plant_name = s(input.plant_name, 160);
  if (plant_name.length < 2) return { ok: false, error: 'Non plant la manke.' };

  const department_code = DEPTS.includes(input.department_code)
    ? input.department_code
    : '';
  if (!department_code) return { ok: false, error: 'Chwazi yon depatman.' };

  const contributor_name = s(input.contributor_name, 120);
  if (contributor_name.length < 2)
    return { ok: false, error: 'Ekri non ou.' };

  const proposed_name = s(input.proposed_name, 160);
  if (kind !== 'koreksyon' && proposed_name.length < 2)
    return { ok: false, error: 'Ekri non ou vle pwopoze a.' };

  // Only accept photo URLs we actually minted (in our bucket, our prefix).
  const photos = (Array.isArray(input.photos) ? input.photos : [])
    .filter((u) => typeof u === 'string' && u.startsWith(PUBLIC_BASE))
    .slice(0, 6);

  const row = {
    plant_id: input.plant_id ? s(input.plant_id, 40) : null,
    plant_not_in_list: input.plant_not_in_list
      ? s(input.plant_not_in_list, 160)
      : null,
    plant_name,
    plant_scientific: s(input.plant_scientific, 200) || null,
    kind,
    proposed_name: proposed_name || null,
    note: s(input.note, 1000) || null,
    department_code,
    commune: s(input.commune, 120) || null,
    locality: s(input.locality, 160) || null,
    knowledge_source: SOURCES.includes(input.knowledge_source)
      ? input.knowledge_source
      : null,
    photo_confirmation: CONFIRM.includes(input.photo_confirmation ?? '')
      ? input.photo_confirmation
      : null,
    photos,
    contributor_name,
    contributor_contact: s(input.contributor_contact, 160) || null,
    allow_cite: !!input.allow_cite,
    status: 'nouvo',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createServiceClient() as any;
  const { data, error } = await sb
    .from('glossary_contributions')
    .insert(row)
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: (data as { id: string }).id };
}
