'use server';

// Consultation booking actions (Melis-only, free). The plan gate (plan='vip')
// and every status transition are enforced HERE — members have no write policy
// on consultation_slots / consultation_bookings, so all mutations run through
// the service role after an ownership re-check (getSessionJoinLink ethos).

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';

const UNLOCKED = new Set(['vip']); // Melis only

type Result = { ok: boolean; error?: string };

// Active = counts against the one-open-booking rule and blocks a new pick.
const ACTIVE = ['pending', 'confirmed', 'reschedule_proposed'] as const;

function revalidate() {
  revalidatePath('/dashboard/konsiltasyon');
  revalidatePath('/admin/konsiltasyon');
}

async function requireMelis() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Ou dwe konekte.' };
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle();
  const plan = (profile as { plan?: string } | null)?.plan ?? 'basic';
  if (!UNLOCKED.has(plan)) {
    return {
      ok: false as const,
      error: 'Konsiltasyon patikilye rezève pou manm Melis.',
    };
  }
  return { ok: true as const, userId: user.id };
}

/** Load a booking the caller owns, or null. Service role (members can read own
 * rows, but we re-check ownership here so the write path never trusts the UI). */
async function ownedBooking(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: any,
  bookingId: string,
  userId: string
) {
  const { data } = await svc
    .from('consultation_bookings')
    .select('id, slot_id, proposed_slot_id, status')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();
  return data as {
    id: string;
    slot_id: string;
    proposed_slot_id: string | null;
    status: string;
  } | null;
}

/** A Melis member books an open slot. Atomically reserves the slot so two
 * members can never take the same one. */
export async function bookConsultationSlot(
  slotId: string,
  input?: { topic?: string | null; note?: string | null }
): Promise<Result> {
  const auth = await requireMelis();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!slotId) return { ok: false, error: 'Chwazi yon kreno.' };

  const topic = (input?.topic ?? '').trim().slice(0, 200) || null;
  const note = (input?.note ?? '').trim().slice(0, 500) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any;

  // One active booking at a time (the partial unique index is the race backstop).
  const { data: openRows } = await svc
    .from('consultation_bookings')
    .select('id')
    .eq('user_id', auth.userId)
    .in('status', ACTIVE)
    .limit(1);
  if (Array.isArray(openRows) && openRows.length > 0) {
    return { ok: false, error: 'Ou gen yon demann k ap tann deja.' };
  }

  // Reserve the slot: the conditional update only succeeds if it is still open.
  const { data: won, error: slotErr } = await svc
    .from('consultation_slots')
    .update({ status: 'booked' })
    .eq('id', slotId)
    .eq('status', 'open')
    .select('id');
  if (slotErr) return { ok: false, error: 'Nou pa ka rezève kreno a kounye a.' };
  if (!won || won.length !== 1) {
    return { ok: false, error: 'Kreno sa a pa disponib ankò.' };
  }

  const { error: insErr } = await svc.from('consultation_bookings').insert({
    user_id: auth.userId,
    slot_id: slotId,
    status: 'pending',
    topic,
    note,
  });
  if (insErr) {
    // Roll the reservation back so the slot stays bookable.
    await svc
      .from('consultation_slots')
      .update({ status: 'open' })
      .eq('id', slotId)
      .eq('status', 'booked');
    if ((insErr as { code?: string }).code === '23505') {
      return { ok: false, error: 'Ou gen yon demann k ap tann deja.' };
    }
    console.error('[konsiltasyon] booking insert failed', insErr);
    return { ok: false, error: 'Nou pa ka anrejistre demann lan kounye a.' };
  }

  revalidate();
  return { ok: true };
}

/** Member accepts the slot the admin proposed on a reschedule. */
export async function acceptReschedule(bookingId: string): Promise<Result> {
  const auth = await requireMelis();
  if (!auth.ok) return { ok: false, error: auth.error };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any;
  const booking = await ownedBooking(svc, bookingId, auth.userId);
  if (
    !booking ||
    booking.status !== 'reschedule_proposed' ||
    !booking.proposed_slot_id
  ) {
    return { ok: false, error: 'Pa gen okenn nouvo lè pou aksepte.' };
  }

  const { data: proposedSlot } = await svc
    .from('consultation_slots')
    .select('starts_at')
    .eq('id', booking.proposed_slot_id)
    .maybeSingle();

  // Free the old slot; the proposed one becomes the agreed slot.
  await svc
    .from('consultation_slots')
    .update({ status: 'open' })
    .eq('id', booking.slot_id);
  const { error } = await svc
    .from('consultation_bookings')
    .update({
      slot_id: booking.proposed_slot_id,
      proposed_slot_id: null,
      status: 'confirmed',
      scheduled_at: proposedSlot?.starts_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

/** Member declines the proposed slot; both slots free up and they pick again. */
export async function declineReschedule(bookingId: string): Promise<Result> {
  const auth = await requireMelis();
  if (!auth.ok) return { ok: false, error: auth.error };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any;
  const booking = await ownedBooking(svc, bookingId, auth.userId);
  if (!booking || booking.status !== 'reschedule_proposed') {
    return { ok: false, error: 'Pa gen okenn nouvo lè pou refize.' };
  }

  const slotIds = [booking.slot_id, booking.proposed_slot_id].filter(
    Boolean
  ) as string[];
  if (slotIds.length > 0) {
    await svc
      .from('consultation_slots')
      .update({ status: 'open' })
      .in('id', slotIds);
  }
  const { error } = await svc
    .from('consultation_bookings')
    .update({
      status: 'declined',
      proposed_slot_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

/** Member cancels their own booking; the slot(s) free up. */
export async function cancelConsultation(bookingId: string): Promise<Result> {
  const auth = await requireMelis();
  if (!auth.ok) return { ok: false, error: auth.error };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any;
  const booking = await ownedBooking(svc, bookingId, auth.userId);
  if (!booking || !ACTIVE.includes(booking.status as (typeof ACTIVE)[number])) {
    return { ok: false, error: 'Nou pa ka anile demann sa a.' };
  }

  const slotIds = [booking.slot_id, booking.proposed_slot_id].filter(
    Boolean
  ) as string[];
  if (slotIds.length > 0) {
    await svc
      .from('consultation_slots')
      .update({ status: 'open' })
      .in('id', slotIds);
  }
  const { error } = await svc
    .from('consultation_bookings')
    .update({
      status: 'cancelled',
      proposed_slot_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}
