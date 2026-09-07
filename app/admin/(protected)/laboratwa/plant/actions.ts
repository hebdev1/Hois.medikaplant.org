'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../../admin-nav-config';

async function assertAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).maybeSingle();
  const p = data as { role: string; admin_role: AdminRole | null } | null;
  if (p?.role !== 'admin') return { ok: false as const, error: 'Aksè entèdi.' };
  if (!hasCapability(p.admin_role, 'manage_guides')) return { ok: false as const, error: 'Ou pa gen pèmisyon.' };
  return { ok: true as const };
}

export type PlantInput = {
  slug: string; name_kr: string; name_fr: string; name_en: string; name_sci: string;
  family: string; parts_used: string; preparations: string; season_months: string;
  regions: string; summary_kr: string; support_kr: string; cautions_kr: string; status: string;
};

const csv = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

function shape(i: PlantInput) {
  const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return {
    slug: (i.slug.trim() || slugify(i.name_kr)).slice(0, 80),
    name_kr: i.name_kr.trim(),
    name_fr: i.name_fr.trim() || null,
    name_en: i.name_en.trim() || null,
    name_sci: i.name_sci.trim(),
    family: i.family.trim() || null,
    parts_used: csv(i.parts_used),
    preparations: csv(i.preparations),
    season_months: csv(i.season_months).map(Number).filter((n) => n >= 1 && n <= 12),
    regions: csv(i.regions).map((r) => r.toUpperCase()),
    summary_kr: i.summary_kr.trim() || null,
    support_kr: i.support_kr.trim() || null,
    cautions_kr: lines(i.cautions_kr),
    status: i.status === 'published' ? 'published' : 'draft',
  };
}

const dup = (m: string) => (/duplicate|unique/i.test(m) ? 'Slug sa a deja egziste.' : m);

export async function createPlant(input: PlantInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const a = await assertAdmin(); if (!a.ok) return a;
  const row = shape(input);
  if (row.name_kr.length < 2 || row.name_sci.length < 2) return { ok: false, error: 'Non Kreyòl ak non syantifik obligatwa.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data, error } = await db.from('plants').insert(row).select('id').single();
  if (error) return { ok: false, error: dup(error.message) };
  revalidatePath('/laboratwa'); revalidatePath('/admin/laboratwa/plant');
  return { ok: true, id: (data as { id: string }).id };
}

export async function updatePlant(id: string, input: PlantInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = await assertAdmin(); if (!a.ok) return a;
  const row = shape(input);
  if (row.name_kr.length < 2 || row.name_sci.length < 2) return { ok: false, error: 'Non Kreyòl ak non syantifik obligatwa.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db.from('plants').update(row).eq('id', id);
  if (error) return { ok: false, error: dup(error.message) };
  revalidatePath('/laboratwa'); revalidatePath('/admin/laboratwa/plant');
  return { ok: true };
}

export async function deletePlant(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = await assertAdmin(); if (!a.ok) return a;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db.from('plants').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/laboratwa'); revalidatePath('/admin/laboratwa/plant');
  return { ok: true };
}
