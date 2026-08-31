'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasCapability, type AdminRole } from '../admin-nav-config';

async function assertGlossAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const { data } = await supabase
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .maybeSingle();
  const p = data as { role: string; admin_role: AdminRole | null } | null;
  if (p?.role !== 'admin') return { ok: false as const, error: 'Aksè entèdi.' };
  if (!hasCapability(p.admin_role, 'manage_guides')) {
    return { ok: false as const, error: 'Ou pa gen pèmisyon pou jere glosè a.' };
  }
  return { ok: true as const, user };
}

export type TermInput = {
  code: string;
  letter: string;
  name: string;
  variants: string; // comma-separated in the form
  family: string;
  scientific_name: string;
  tramil: string;
  status: string;
  note: string;
  active: boolean;
  display_order: number;
};

const TRAMIL = ['konfime', 'pa-jwenn'];
const STATUS = ['verifye', 'pwovizwa', 'pwoblèm'];

function clean(input: TermInput) {
  const name = input.name.trim();
  const letter = (input.letter.trim() || name[0] || 'A').toUpperCase().slice(0, 1);
  const variants = input.variants
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  return {
    code: input.code.trim() || null,
    letter,
    name,
    variants,
    family: input.family.trim() || null,
    scientific_name: input.scientific_name.trim() || null,
    tramil: TRAMIL.includes(input.tramil) ? input.tramil : 'pa-jwenn',
    status: STATUS.includes(input.status) ? input.status : 'pwovizwa',
    note: input.note.trim() || null,
    active: !!input.active,
    display_order: Math.max(0, Math.floor(Number(input.display_order) || 0)),
  };
}

const dupMsg = (m: string) =>
  /duplicate|unique/i.test(m) ? 'Kòd GLOS sa a deja egziste.' : m;

export async function createGlossTerm(
  input: TermInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await assertGlossAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const p = clean(input);
  if (p.name.length < 2) return { ok: false, error: 'Non an twò kout.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { data, error } = await db
    .from('glossary_terms')
    .insert(p)
    .select('id')
    .single();
  if (error) return { ok: false, error: dupMsg(error.message) };
  revalidatePath('/admin/glose');
  revalidatePath('/glose');
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateGlossTerm(
  id: string,
  input: TermInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertGlossAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const p = clean(input);
  if (p.name.length < 2) return { ok: false, error: 'Non an twò kout.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db
    .from('glossary_terms')
    .update({ ...p, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: dupMsg(error.message) };
  revalidatePath('/admin/glose');
  revalidatePath('/glose');
  return { ok: true };
}

export async function deleteGlossTerm(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertGlossAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceClient() as any;
  const { error } = await db.from('glossary_terms').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/glose');
  revalidatePath('/glose');
  return { ok: true };
}
