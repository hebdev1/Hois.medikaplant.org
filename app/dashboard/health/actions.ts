'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type HealthLogInsert = Database['public']['Tables']['health_logs']['Insert'];
type HealthLogRow = Database['public']['Tables']['health_logs']['Row'];

export type Metric = 'blood_sugar' | 'weight' | 'pressure';

const METRIC_BOUNDS: Record<Metric, { min: number; max: number }> = {
  blood_sugar: { min: 20, max: 600 },
  weight: { min: 20, max: 350 },
  pressure: { min: 40, max: 260 },
};

// ─── Add a log (per-metric, parses pressure as "120/80" or just "120") ──────

export async function addHealthLog(
  metric: Metric,
  rawValue: string,
  notes?: string
): Promise<
  | { ok: true; row: HealthLogRow }
  | { ok: false; error: string }
> {
  const trimmed = rawValue.trim();
  if (!trimmed) return { ok: false, error: 'Antre yon valè.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const insert: HealthLogInsert = { user_id: user.id };

  if (metric === 'pressure') {
    // Accept "120/80", "120 / 80", or "120" (treats single value as systolic).
    const match = trimmed.match(/^(\d{2,3})\s*\/?\s*(\d{2,3})?$/);
    if (!match) return { ok: false, error: 'Fòma: "120/80" oswa "120".' };
    const sys = Number(match[1]);
    const dia = match[2] !== undefined ? Number(match[2]) : null;
    if (sys < METRIC_BOUNDS.pressure.min || sys > METRIC_BOUNDS.pressure.max) {
      return { ok: false, error: 'Tansyon sistolik la pa nan limit rezonab.' };
    }
    if (dia !== null && (dia < 30 || dia > 200)) {
      return { ok: false, error: 'Tansyon dyastolik la pa nan limit rezonab.' };
    }
    insert.blood_pressure_systolic = sys;
    if (dia !== null) insert.blood_pressure_diastolic = dia;
  } else {
    const value = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(value)) return { ok: false, error: 'Valè a pa yon nimewo valab.' };
    const bounds = METRIC_BOUNDS[metric];
    if (value < bounds.min || value > bounds.max) {
      return { ok: false, error: `Valè a dwe ant ${bounds.min} ak ${bounds.max}.` };
    }
    if (metric === 'blood_sugar') insert.blood_sugar = value;
    if (metric === 'weight') insert.weight = value;
  }

  if (notes && notes.trim()) {
    insert.notes = notes.trim().slice(0, 500);
  }

  const { data, error } = await supabase
    .from('health_logs')
    .insert(insert)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/dashboard/health');
  revalidatePath('/dashboard');
  return { ok: true, row: data as HealthLogRow };
}

// ─── Delete a log (RLS already enforces ownership) ──────────────────────────

export async function deleteHealthLog(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { error } = await supabase
    .from('health_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/health');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ─── Export user's health history as CSV ────────────────────────────────────

export async function getHealthCsv(): Promise<
  { ok: true; filename: string; csv: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Ou dwe konekte.' };

  const { data } = await supabase
    .from('health_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false });
  const rows = (data ?? []) as HealthLogRow[];

  const header = [
    'logged_at',
    'blood_sugar_mg_dL',
    'weight_kg',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'heart_rate',
    'notes',
  ];

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.logged_at,
        r.blood_sugar,
        r.weight,
        r.blood_pressure_systolic,
        r.blood_pressure_diastolic,
        r.heart_rate,
        r.notes,
      ]
        .map(escape)
        .join(',')
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    filename: `medikaplant-sante-${stamp}.csv`,
    csv: lines.join('\n'),
  };
}
