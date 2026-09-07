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

export type PlantRec = { name_kr: string; sci: string; prep: string; tramil: string };
export type ConditionInput = {
  slug: string; name_kr: string; intro_kr: string; red_flag_kr: string;
  doctor_limit_kr: string; doctor_attention_kr: string; display_order: number;
  status: string; plants: PlantRec[];
};

function shape(i: ConditionInput) {
  const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const plants = (Array.isArray(i.plants) ? i.plants : [])
    .map((p) => ({
      name_kr: String(p.name_kr ?? '').trim(),
      sci: String(p.sci ?? '').trim(),
      prep: String(p.prep ?? '').trim(),
      tramil: ['REK', 'ENV', 'TOK'].includes(String(p.tramil)) ? p.tramil : 'REK',
    }))
    .filter((p) => p.name_kr.length > 0);
  return {
    slug: (i.slug.trim() || slugify(i.name_kr)).slice(0, 80),
    name_kr: i.name_kr.trim(),
    intro_kr: i.intro_kr.trim() || null,
    red_flag_kr: i.red_flag_kr.trim() || null,
    doctor_limit_kr: i.doctor_limit_kr.trim() || null,
    doctor_attention_kr: i.doctor_attention_kr.trim() || null,
    display_order: Math.max(0, Math.floor(Number(i.display_order) || 0)),
    status: i.status === 'draft' ? 'draft' : 'published',
    plants,
  };
}
const dup = (m: string) => (/duplicate|unique/i.test(m) ? 'Slug sa a deja egziste.' : m);

export async function createCondition(input: ConditionInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = await assertAdmin(); if (!a.ok) return a;
  const row = shape(input);
  if (row.name_kr.length < 2) return { ok: false, error: 'Non kondisyon an obligatwa.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db.from('lab_conditions').insert(row);
  if (error) return { ok: false, error: dup(error.message) };
  revalidatePath('/laboratwa/maladi'); revalidatePath('/admin/laboratwa/kondisyon');
  return { ok: true };
}

export async function updateCondition(id: string, input: ConditionInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = await assertAdmin(); if (!a.ok) return a;
  const row = shape(input);
  if (row.name_kr.length < 2) return { ok: false, error: 'Non kondisyon an obligatwa.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db.from('lab_conditions').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { ok: false, error: dup(error.message) };
  revalidatePath('/laboratwa/maladi'); revalidatePath('/admin/laboratwa/kondisyon');
  return { ok: true };
}

export async function deleteCondition(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = await assertAdmin(); if (!a.ok) return a;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db.from('lab_conditions').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/laboratwa/maladi'); revalidatePath('/admin/laboratwa/kondisyon');
  return { ok: true };
}
