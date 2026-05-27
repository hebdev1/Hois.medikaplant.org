'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ConsultationRow = Database['public']['Tables']['consultations']['Row'];
type ConsultationUpdate = Database['public']['Tables']['consultations']['Update'];

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
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return { ok: false as const, error: 'Aksè entèdi.' };
  }
  return { ok: true as const, user, supabase };
}

export type ConsultationResult =
  | { ok: true; row: ConsultationRow }
  | { ok: false; error: string };

/**
 * Convert a requested consultation into a fully-scheduled one. Sets
 * scheduled_at + consultant_name + duration + optional meeting URL.
 * The DB trigger trg_notify_on_consultation_scheduled fires a member
 * notification automatically.
 */
export async function scheduleConsultation(
  id: string,
  input: {
    consultant_name: string;
    consultant_role?: string | null;
    scheduled_at: string;
    duration_minutes: number;
    meeting_url?: string | null;
    notes?: string | null;
  }
): Promise<ConsultationResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = input.consultant_name.trim();
  if (name.length < 2) {
    return { ok: false, error: 'Non konsiltan an manke.' };
  }
  const when = new Date(input.scheduled_at);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: 'Dat la pa valid.' };
  }
  if (when.getTime() < Date.now() - 60_000) {
    return { ok: false, error: 'Dat la pa ka nan pase.' };
  }
  const duration =
    input.duration_minutes >= 5 && input.duration_minutes <= 240
      ? input.duration_minutes
      : 30;

  const update: ConsultationUpdate = {
    status: 'scheduled',
    consultant_name: name,
    consultant_role: input.consultant_role?.trim() || null,
    scheduled_at: when.toISOString(),
    duration_minutes: duration,
    meeting_url: input.meeting_url?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await auth.supabase
    .from('consultations')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/admin/consultations');
  revalidatePath('/dashboard/settings');
  return { ok: true, row: data as ConsultationRow };
}

/**
 * Mark a consultation as completed; admin may also leave notes,
 * recommendations, and a follow-up date for the patient.
 */
export async function completeConsultation(
  id: string,
  input: {
    notes?: string | null;
    recommendations?: string | null;
    prescription?: string | null;
    follow_up_at?: string | null;
  }
): Promise<ConsultationResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const update: ConsultationUpdate = {
    status: 'completed',
    notes: input.notes?.trim() || null,
    recommendations: input.recommendations?.trim() || null,
    prescription: input.prescription?.trim() || null,
    follow_up_at: input.follow_up_at?.trim()
      ? new Date(input.follow_up_at).toISOString()
      : null,
  };

  const { data, error } = await auth.supabase
    .from('consultations')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/admin/consultations');
  revalidatePath('/dashboard/settings');
  return { ok: true, row: data as ConsultationRow };
}

/**
 * Reject a request (e.g. admin can't accommodate). Sets status='cancelled'.
 */
export async function cancelConsultationAdmin(
  id: string,
  reason?: string | null
): Promise<ConsultationResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const update: ConsultationUpdate = {
    status: 'cancelled',
    notes: reason?.trim() ? `Anile: ${reason.trim()}` : null,
  };

  const { data, error } = await auth.supabase
    .from('consultations')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Erè inkoni.' };

  revalidatePath('/admin/consultations');
  revalidatePath('/dashboard/settings');
  return { ok: true, row: data as ConsultationRow };
}
