import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { upsertContactByEmail } from './client';

/**
 * Pull all the HubSpot-relevant data for a member out of Supabase and
 * push it as a contact upsert, then log the attempt. Returns a typed
 * result so callers know whether the push succeeded, was skipped (no
 * token / no email), or errored.
 *
 * Must be called with an admin-scoped Supabase client (reads
 * profiles + user_medical_info across users; admin RLS policies allow
 * this).
 */
export type SyncResult =
  | { ok: true; contactId: string; created: boolean }
  | { ok: false; status: 'skipped'; reason: string }
  | { ok: false; status: 'error'; error: string };

const PLAN_LIFECYCLE: Record<string, string> = {
  basic: 'subscriber',
  premium: 'customer',
  vip: 'customer',
};

export async function syncMemberToHubspot(
  supabase: SupabaseClient<Database>,
  userId: string,
  triggeredBy: string | null = null
): Promise<SyncResult> {
  // 1. Gather data
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('email, first_name, last_name, phone, plan, role, admin_role, created_at')
    .eq('id', userId)
    .maybeSingle();
  const profile = profileRow as {
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    plan: 'basic' | 'premium' | 'vip';
    role: 'user' | 'admin';
    admin_role: string | null;
    created_at: string;
  } | null;

  if (!profile?.email) {
    await logSync(supabase, {
      user_id: userId,
      direction: 'push',
      status: 'skipped',
      detail: 'no_email',
      triggered_by: triggeredBy,
    });
    return { ok: false, status: 'skipped', reason: 'no_email' };
  }

  const { data: medicalRow } = await supabase
    .from('user_medical_info')
    .select('conditions, health_goal, health_goal_other')
    .eq('user_id', userId)
    .maybeSingle();
  const medical = medicalRow as {
    conditions: string[] | null;
    health_goal: string | null;
    health_goal_other: string | null;
  } | null;

  // 2. Shape HubSpot payload — only custom properties that exist in the
  //    HubSpot account will be persisted; unknown ones are silently
  //    dropped by the API. The setup checklist tells the user to create
  //    the hois_* custom properties.
  const goal =
    medical?.health_goal === 'other' && medical?.health_goal_other
      ? medical.health_goal_other
      : medical?.health_goal ?? null;

  const properties: Record<string, string | number | null | undefined> = {
    firstname: profile.first_name,
    lastname: profile.last_name,
    phone: profile.phone,
    lifecyclestage: PLAN_LIFECYCLE[profile.plan] ?? 'subscriber',
    hois_plan: profile.plan,
    hois_member_id: userId,
    hois_conditions: medical?.conditions?.join(', ') || null,
    hois_health_goal: goal,
  };
  if (profile.role === 'admin') {
    properties.hois_admin_role = profile.admin_role ?? 'admin';
  }

  // 3. Push
  const res = await upsertContactByEmail(profile.email, properties);
  if (!res.ok) {
    if (res.status === 'skipped') {
      await logSync(supabase, {
        user_id: userId,
        direction: 'push',
        status: 'skipped',
        detail: res.reason,
        triggered_by: triggeredBy,
      });
      return { ok: false, status: 'skipped', reason: res.reason };
    }
    await logSync(supabase, {
      user_id: userId,
      direction: 'push',
      status: 'error',
      detail: res.error.slice(0, 1000),
      triggered_by: triggeredBy,
    });
    return { ok: false, status: 'error', error: res.error };
  }

  await logSync(supabase, {
    user_id: userId,
    direction: 'push',
    hubspot_contact_id: res.data.id,
    status: 'ok',
    detail: res.data.created ? 'created' : 'updated',
    triggered_by: triggeredBy,
  });
  return { ok: true, contactId: res.data.id, created: res.data.created };
}

async function logSync(
  supabase: SupabaseClient<Database>,
  row: Database['public']['Tables']['hubspot_sync_log']['Insert']
) {
  try {
    await supabase.from('hubspot_sync_log').insert(row);
  } catch {
    // Logging is best-effort — never let it break the caller.
  }
}
