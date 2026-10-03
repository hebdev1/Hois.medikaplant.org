'use server';

// Admin management of consultation availability (slots) and member bookings.
// Gated to `manage_subscriptions` (super_admin + admin). Writes go through the
// authenticated admin client — the is_admin() RLS policies cover slots/bookings,
// and the same client inserts the member's notification. On validate/reschedule
// the member is notified (bell + push via the notifications insert, plus email).

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { emailNotifyMember } from '@/lib/email/notify';
import { hasCapability, type AdminRole } from '../admin-nav-config';
import { haitiLocalToUtcISO } from '@/lib/haiti-time';

const MODALITIES = ['video', 'phone', 'in_person'] as const;

export type SlotFormState = { ok?: boolean; error?: string };
type Result = { ok: boolean; error?: string };

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
  if (!hasCapability(row.admin_role, 'manage_subscriptions')) {
    return { ok: false as const, error: 'Pa gen pèmisyon.' };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ok: true as const, user, supabase, sb: supabase as any };
}

function revalidate() {
  revalidatePath('/admin/konsiltasyon');
  revalidatePath('/dashboard/konsiltasyon');
}

/** Notify the member (bell + push off the notifications insert, plus email). */
async function notifyMember(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  adminId: string,
  userId: string,
  title: string,
  message: string
) {
  await supabase.from('notifications').insert({
    title,
    message,
    target: 'user',
    target_user_id: userId,
    link_url: '/dashboard/konsiltasyon',
    created_by: adminId,
  });
  await emailNotifyMember(supabase, userId, {
    subject: title,
    heading: title,
    body: [message],
    linkPath: '/dashboard/konsiltasyon',
    linkLabel: 'Wè konsiltasyon ou',
  });
}

// ── Availability ────────────────────────────────────────────────────────────

export async function createSlot(
  _prev: SlotFormState,
  formData: FormData
): Promise<SlotFormState> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const get = (k: string) => (formData.get(k)?.toString() ?? '').trim();
  const date = get('date'); // YYYY-MM-DD (Haiti local)
  const time = get('time'); // HH:MM (Haiti local)
  const duration = Math.max(10, Math.min(240, Number(get('duration')) || 30));
  const modalityRaw = get('modality');
  const modality = (MODALITIES as readonly string[]).includes(modalityRaw)
    ? modalityRaw
    : 'video';
  const consultant = get('consultant') || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Dat la pa valid.' };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: 'Lè a pa valid.' };

  const startsAt = haitiLocalToUtcISO(date, time);
  if (Number.isNaN(Date.parse(startsAt))) return { error: 'Dat/lè pa valid.' };

  const { error } = await auth.sb.from('consultation_slots').insert({
    starts_at: startsAt,
    duration_minutes: duration,
    modality,
    consultant_name: consultant,
    status: 'open',
    created_by: auth.user.id,
  });
  if (error) return { error: error.message };

  revalidate();
  return { ok: true };
}

export async function deleteSlot(slotId: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: slot } = await auth.sb
    .from('consultation_slots')
    .select('id, status')
    .eq('id', slotId)
    .maybeSingle();
  if (!slot) return { ok: false, error: 'Kreno a pa egziste.' };
  if (slot.status !== 'open') {
    return { ok: false, error: 'Kreno sa a gen yon demann — jere demann lan anvan.' };
  }
  const { error } = await auth.sb
    .from('consultation_slots')
    .delete()
    .eq('id', slotId)
    .eq('status', 'open');
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

// ── Booking triage ────────────────────────────────────────────────────────────

export async function validateBooking(bookingId: string): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: booking } = await auth.sb
    .from('consultation_bookings')
    .select('id, user_id, slot_id, status')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, error: 'Demann lan pa egziste.' };
  if (booking.status !== 'pending') {
    return { ok: false, error: 'Se sèlman yon demann ann atant ou ka konfime.' };
  }

  const { data: slot } = await auth.sb
    .from('consultation_slots')
    .select('starts_at')
    .eq('id', booking.slot_id)
    .maybeSingle();

  const { error } = await auth.sb
    .from('consultation_bookings')
    .update({
      status: 'confirmed',
      scheduled_at: slot?.starts_at ?? null,
      handled_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  await notifyMember(
    auth.sb,
    auth.user.id,
    booking.user_id,
    'Konsiltasyon ou konfime',
    'Nou konfime randevou konsiltasyon ou. Louvri paj konsiltasyon an pou wè detay yo.'
  );

  revalidate();
  return { ok: true };
}

export async function rescheduleBooking(
  bookingId: string,
  newSlotId: string
): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!newSlotId) return { ok: false, error: 'Chwazi yon nouvo kreno.' };

  const { data: booking } = await auth.sb
    .from('consultation_bookings')
    .select('id, user_id, slot_id, proposed_slot_id, status')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, error: 'Demann lan pa egziste.' };
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return { ok: false, error: 'Ou pa ka repwograme demann sa a.' };
  }
  if (newSlotId === booking.slot_id) {
    return { ok: false, error: 'Chwazi yon kreno diferan.' };
  }

  // Reserve the new slot (only succeeds if still open).
  const { data: won } = await auth.sb
    .from('consultation_slots')
    .update({ status: 'booked' })
    .eq('id', newSlotId)
    .eq('status', 'open')
    .select('id');
  if (!won || won.length !== 1) {
    return { ok: false, error: 'Nouvo kreno a pa disponib ankò.' };
  }

  // Free any previously-proposed slot that is now superseded.
  if (booking.proposed_slot_id && booking.proposed_slot_id !== newSlotId) {
    await auth.sb
      .from('consultation_slots')
      .update({ status: 'open' })
      .eq('id', booking.proposed_slot_id);
  }

  const { error } = await auth.sb
    .from('consultation_bookings')
    .update({
      proposed_slot_id: newSlotId,
      status: 'reschedule_proposed',
      handled_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) {
    // Roll the reservation back.
    await auth.sb
      .from('consultation_slots')
      .update({ status: 'open' })
      .eq('id', newSlotId)
      .eq('status', 'booked');
    return { ok: false, error: error.message };
  }

  await notifyMember(
    auth.sb,
    auth.user.id,
    booking.user_id,
    'Nou pwopoze yon lòt lè pou konsiltasyon ou',
    'Nou pwopoze w yon nouvo lè pou konsiltasyon ou. Ale nan paj konsiltasyon an pou aksepte oswa refize l.'
  );

  revalidate();
  return { ok: true };
}

export async function setBookingMeeting(
  bookingId: string,
  meetingUrl: string,
  consultantName: string
): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const url = meetingUrl.trim().slice(0, 2000) || null;
  const consultant = consultantName.trim().slice(0, 200) || null;

  const { error } = await auth.sb
    .from('consultation_bookings')
    .update({
      meeting_url: url,
      consultant_name: consultant,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

const CLOSE_STATUSES = ['completed', 'no_show', 'cancelled'] as const;
type CloseStatus = (typeof CLOSE_STATUSES)[number];

export async function setBookingStatus(
  bookingId: string,
  next: CloseStatus
): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!CLOSE_STATUSES.includes(next)) {
    return { ok: false, error: 'Estati pa valid.' };
  }

  const { data: booking } = await auth.sb
    .from('consultation_bookings')
    .select('id, slot_id, proposed_slot_id, status')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, error: 'Demann lan pa egziste.' };

  // Cancelling frees the slot(s); completed/no_show keep the slot as history.
  if (next === 'cancelled') {
    const slotIds = [booking.slot_id, booking.proposed_slot_id].filter(
      Boolean
    ) as string[];
    if (slotIds.length > 0) {
      await auth.sb
        .from('consultation_slots')
        .update({ status: 'open' })
        .in('id', slotIds);
    }
  }

  const { error } = await auth.sb
    .from('consultation_bookings')
    .update({
      status: next,
      proposed_slot_id: next === 'cancelled' ? null : booking.proposed_slot_id,
      handled_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

export async function updateBookingAdminNote(
  bookingId: string,
  note: string
): Promise<Result> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const clean = note.trim().slice(0, 4000);
  const { error } = await auth.sb
    .from('consultation_bookings')
    .update({
      admin_note: clean.length > 0 ? clean : null,
      handled_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}
