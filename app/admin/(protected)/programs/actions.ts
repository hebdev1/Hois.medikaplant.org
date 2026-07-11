'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import type { Database } from '@/types/database';

type ProgramRow = Database['public']['Tables']['programs']['Row'];
type ProgramInsert = Database['public']['Tables']['programs']['Insert'];
type ProgramUpdate = Database['public']['Tables']['programs']['Update'];
type Plan = Database['public']['Enums']['plan_type'];

const PLAN_VALUES: readonly Plan[] = ['basic', 'premium', 'vip'];
const LEVEL_VALUES = ['debutan', 'entermedye', 'avanse', 'tout_nivo'] as const;

// ─── Auth helper ───────────────────────────────────────────────────────────

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
  if (!hasCapability(row.admin_role, 'manage_programs')) {
    return {
      ok: false as const,
      error: 'Ou pa gen pèmisyon pou jere pwogram yo.',
    };
  }
  return { ok: true as const, user, supabase };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─── Form → typed input ────────────────────────────────────────────────────

export type ProgramState = { error?: string; ok?: boolean; id?: string };

function readForm(formData: FormData) {
  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  // condition_tags come in as comma-separated slugs
  const tags = get('condition_tags')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
  // milestone_days: "7, 14, 21, 30" → [7,14,21,30]
  const milestones = get('milestone_days')
    .split(',')
    .map((n) => Math.floor(Number(n.trim())))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 10);

  return {
    name: get('name'),
    slug: get('slug'),
    description: get('description') || null,
    short_tagline: get('short_tagline') || null,
    level: get('level') || 'tout_nivo',
    variant: get('variant') || null,
    total_days: Math.max(1, Math.min(365, Number(get('total_days')) || 30)),
    milestone_days: milestones,
    plan_required: get('plan_required') || 'basic',
    condition_tags: tags,
    accent_color: get('accent_color') || '#65881a',
    hero_color: get('hero_color') || null,
    active: formData.get('active') === 'on',
  };
}

function validate(
  input: ReturnType<typeof readForm>
): { ok: true; data: ProgramInsert } | { ok: false; error: string } {
  if (input.name.length < 3) return { ok: false, error: 'Non pwogram twò kout.' };
  if (input.name.length > 120) return { ok: false, error: 'Non pwogram twò long.' };
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  if (slug.length < 2) return { ok: false, error: 'Slug la pa valid.' };
  if (!PLAN_VALUES.includes(input.plan_required as Plan)) {
    return { ok: false, error: 'Plan pa valid.' };
  }
  if (!LEVEL_VALUES.includes(input.level as (typeof LEVEL_VALUES)[number])) {
    return { ok: false, error: 'Nivo pa valid.' };
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.accent_color)) {
    return { ok: false, error: 'Koulè aksan pa valid (egz: #65881a).' };
  }
  if (input.hero_color && !/^#[0-9A-Fa-f]{6}$/.test(input.hero_color)) {
    return { ok: false, error: 'Koulè ewo pa valid.' };
  }
  return {
    ok: true,
    data: {
      name: input.name,
      slug,
      description: input.description,
      short_tagline: input.short_tagline,
      level: input.level,
      variant: input.variant,
      total_days: input.total_days,
      milestone_days: input.milestone_days,
      plan_required: input.plan_required as Plan,
      condition_tags: input.condition_tags,
      accent_color: input.accent_color,
      hero_color: input.hero_color,
      active: input.active,
    } as ProgramInsert,
  };
}

// ─── Create / update ───────────────────────────────────────────────────────

export async function saveProgram(
  id: string | null,
  _prev: ProgramState,
  formData: FormData
): Promise<ProgramState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const input = readForm(formData);
  const v = validate(input);
  if (!v.ok) return { error: v.error };

  if (id) {
    const { error } = await auth.supabase
      .from('programs')
      .update(v.data as ProgramUpdate)
      .eq('id', id);
    if (error) {
      if (error.code === '23505') return { error: 'Slug deja itilize.' };
      return { error: error.message };
    }
    revalidatePath('/admin/programs');
    revalidatePath('/admin/health');
    revalidatePath('/dashboard');
    return { ok: true, id };
  }

  const { data, error } = await auth.supabase
    .from('programs')
    .insert(v.data)
    .select('id')
    .single();
  if (error || !data) {
    if (error?.code === '23505') return { error: 'Slug deja itilize.' };
    return { error: error?.message ?? 'Erè inkoni.' };
  }
  revalidatePath('/admin/programs');
  revalidatePath('/admin/health');
  revalidatePath('/dashboard');
  redirect(`/admin/programs/${(data as { id: string }).id}?created=1`);
}

// ─── Toggle active ─────────────────────────────────────────────────────────

export async function toggleProgramActive(
  id: string
): Promise<{ ok: true; active: boolean } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: current } = await auth.supabase
    .from('programs')
    .select('active')
    .eq('id', id)
    .maybeSingle();
  const c = current as { active: boolean } | null;
  if (!c) return { ok: false, error: 'Pwogram lan pa egziste.' };

  const next = !c.active;
  const { error } = await auth.supabase
    .from('programs')
    .update({ active: next })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/programs');
  revalidatePath('/admin/health');
  return { ok: true, active: next };
}

// ─── Bulk-change plan gate (block for a plan tier) ─────────────────────────
// Convenience action: from the list row you can lift/lower the plan gate
// with one click instead of opening the full form.

export async function setProgramPlanGate(
  id: string,
  plan: Plan
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!PLAN_VALUES.includes(plan)) return { ok: false, error: 'Plan pa valid.' };

  const { error } = await auth.supabase
    .from('programs')
    .update({ plan_required: plan })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/programs');
  revalidatePath('/admin/health');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteProgram(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Refuse to delete when active user_programs still reference this program —
  // otherwise members lose their in-flight enrollments silently. Admin must
  // deactivate first, migrate members off, then delete.
  const { count } = await auth.supabase
    .from('user_programs')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', id)
    .eq('is_active', true);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Pa ka efase — ${count} manm gen pwogram sa a aktif. Dezaktive li dabò.`,
    };
  }

  const { error } = await auth.supabase.from('programs').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/programs');
  revalidatePath('/admin/health');
  return { ok: true };
}

// ─── Duplicate ─────────────────────────────────────────────────────────────
// Clones a program row + all its program_tasks under a new slug. Useful for
// building a new variant off an existing 30-day plan without redoing all
// the tasks from scratch. New copy starts inactive so admin can review.

export async function duplicateProgram(
  id: string
): Promise<{ ok: true; newId: string } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: srcRaw } = await auth.supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  const src = srcRaw as ProgramRow | null;
  if (!src) return { ok: false, error: 'Pwogram sous la pa egziste.' };

  // Craft a fresh slug: "<original>-kopi-2", incrementing until unused.
  const base = `${src.slug}-kopi`;
  let slug = base;
  let attempt = 2;
  while (true) {
    const { data: taken } = await auth.supabase
      .from('programs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!taken) break;
    slug = `${base}-${attempt}`;
    attempt++;
    if (attempt > 20) return { ok: false, error: 'Twòp kopi deja egziste.' };
  }

  const insertPayload: ProgramInsert = {
    name: `${src.name} (kopi)`,
    slug,
    description: src.description,
    short_tagline: src.short_tagline,
    level: src.level,
    variant: src.variant,
    total_days: src.total_days,
    milestone_days: src.milestone_days,
    plan_required: src.plan_required,
    condition_tags: src.condition_tags,
    accent_color: src.accent_color,
    hero_color: src.hero_color,
    active: false, // Never surface the clone before admin reviews it.
  };

  const { data: created, error: createErr } = await auth.supabase
    .from('programs')
    .insert(insertPayload)
    .select('id')
    .single();
  if (createErr || !created) {
    return { ok: false, error: createErr?.message ?? 'Erè kreyasyon.' };
  }
  const newId = (created as { id: string }).id;

  // Copy program_tasks. We do this in one SELECT + one INSERT with the
  // new program_id so we don't fan out N round-trips.
  const { data: tasksRaw } = await auth.supabase
    .from('program_tasks')
    .select(
      'title, day_number, order_index, chip_kind, chip_label, meta, condition_tags'
    )
    .eq('program_id', id);
  const tasks = (tasksRaw ?? []) as Array<Record<string, unknown>>;
  if (tasks.length > 0) {
    const rows = tasks.map((t) => ({ ...t, program_id: newId }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (auth.supabase as any).from('program_tasks').insert(rows);
  }

  revalidatePath('/admin/programs');
  return { ok: true, newId };
}
