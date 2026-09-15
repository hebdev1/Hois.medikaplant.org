'use server';

// "Lakou Limyè" tab manager. Dynamic, admin-managed tabs (lakou_tabs,
// migration 132). Content (videos/audio/articles) is assigned to a tab via
// each item's lakou_tab_id, edited in the respective content editor.

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

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `tab-${Date.now().toString(36)}`
  );
}

export type LakouTab = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean;
};

export type LakouTabOption = { id: string; name: string };

/** All tabs (admin manager). */
export async function listLakouTabs(): Promise<LakouTab[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];
  const { data } = await auth.sb
    .from('lakou_tabs')
    .select('id, name, slug, display_order, active')
    .order('display_order', { ascending: true });
  return (data ?? []) as LakouTab[];
}

/** Active tabs for the per-item "Tab Lakou Limyè" selectors in content editors. */
export async function getLakouTabOptions(): Promise<LakouTabOption[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];
  const { data } = await auth.sb
    .from('lakou_tabs')
    .select('id, name')
    .eq('active', true)
    .order('display_order', { ascending: true });
  return (data ?? []) as LakouTabOption[];
}

export type LakouTabState = { ok?: boolean; error?: string; id?: string };

export async function saveLakouTab(input: {
  id?: string;
  name: string;
  display_order?: number;
  active: boolean;
}): Promise<LakouTabState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const name = input.name.trim();
  if (name.length < 2) return { error: 'Non tab la twò kout.' };

  let error;
  let id = input.id;
  if (input.id) {
    // Keep slug stable across renames (content references tab by id; the
    // member page's ?tab= uses the slug).
    ({ error } = await auth.sb
      .from('lakou_tabs')
      .update({
        name,
        display_order: Number.isFinite(input.display_order) ? Number(input.display_order) : 0,
        active: !!input.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id));
  } else {
    const res = await auth.sb
      .from('lakou_tabs')
      .insert({
        name,
        slug: slugify(name),
        display_order: Number.isFinite(input.display_order) ? Number(input.display_order) : 0,
        active: !!input.active,
      })
      .select('id')
      .single();
    error = res.error;
    id = res.data?.id;
  }
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: 'Yon tab ak non sa a deja egziste.' };
    }
    return { error: error.message };
  }
  revalidatePath('/admin/lakou');
  revalidatePath('/dashboard/lakou-limye');
  return { ok: true, id };
}

export async function deleteLakouTab(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  // Content rows keep existing but their lakou_tab_id is nulled by the FK
  // (on delete set null) — nothing is destroyed, just unassigned.
  const { error } = await auth.sb.from('lakou_tabs').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/lakou');
  revalidatePath('/dashboard/lakou-limye');
  return { ok: true };
}
