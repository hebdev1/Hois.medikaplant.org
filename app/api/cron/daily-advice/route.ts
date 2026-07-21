import { NextResponse } from 'next/server';
import { createServiceRoleClient, verifyCronAuth } from '@/lib/cron-auth';
import { emailNotifyMember } from '@/lib/email/notify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // cron is one-shot, no need for streaming

// ─── /api/cron/daily-advice ───────────────────────────────────────────────
//
// Fires once a day (scheduled by Supabase pg_cron — see migration 062).
// Picks today's most recent daily_advice row and fans out a branded email
// to every member who has:
//   • email_notifications = true   (master switch)
//   • daily_advice_email  = true   (category opt-in)
// and whose plan is high enough to access the advice (plan_required).
// If the advice has condition_tags set we further restrict to users
// whose user_medical_info.conditions overlap.
//
// The fan-out is sequential with await — gentle on Resend rate limits
// (10 req/s default) and the bulk should be small enough (one tier of
// the member base per day) that wall-clock stays under the 60s budget.

type AdviceRow = {
  id: string;
  plant_name: string | null;
  body_html: string;
  condition_tags: string[];
  publish_date: string;
  plan_required: 'basic' | 'premium' | 'vip';
};

type ProfileRow = {
  id: string;
  plan: 'basic' | 'premium' | 'vip';
};

type MedicalRow = {
  user_id: string;
  conditions: string[];
};

const PLAN_RANK: Record<string, number> = {
  basic: 1,
  premium: 2,
  vip: 3,
};

function planUnlocks(memberPlan: string, required: string): boolean {
  return (PLAN_RANK[memberPlan] ?? 0) >= (PLAN_RANK[required] ?? 99);
}

function bodyExcerpt(html: string): string {
  // Strip HTML for the email-body paragraph. Keeps the first ~280 chars
  // of plain text so the email feels like a teaser, with a CTA to read
  // the full version on the dashboard.
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 280 ? `${text.slice(0, 280)}…` : text;
}

export async function POST(req: Request) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }

  // Pick the most recent advice whose publish_date <= today. Falls back
  // to the newest row overall if nothing is scheduled (rare, but keeps
  // the cron from sending zero emails on a content-empty day).
  const today = new Date().toISOString().slice(0, 10);
  const { data: latestData } = await supabase
    .from('daily_advice')
    .select('id, plant_name, body_html, condition_tags, publish_date, plan_required')
    .lte('publish_date', today)
    .order('publish_date', { ascending: false })
    .limit(1);
  const advice =
    (latestData?.[0] as AdviceRow | undefined) ??
    ((
      await supabase
        .from('daily_advice')
        .select(
          'id, plant_name, body_html, condition_tags, publish_date, plan_required'
        )
        .order('publish_date', { ascending: false })
        .limit(1)
    ).data?.[0] as AdviceRow | undefined);

  if (!advice) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_advice' });
  }

  // Eligible recipients: opted-in + plan unlocks
  const { data: prefsRaw } = await supabase
    .from('user_preferences')
    .select('user_id')
    .eq('email_notifications', true)
    .eq('daily_advice_email', true);
  const userIds = ((prefsRaw ?? []) as Array<{ user_id: string }>).map(
    (r) => r.user_id
  );
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_recipients' });
  }

  const [{ data: profilesRaw }, { data: medicalRaw }] = await Promise.all([
    supabase.from('profiles').select('id, plan').in('id', userIds),
    supabase
      .from('user_medical_info')
      .select('user_id, conditions')
      .in('user_id', userIds),
  ]);

  const conditionByUser = new Map<string, Set<string>>();
  for (const r of (medicalRaw ?? []) as MedicalRow[]) {
    conditionByUser.set(r.user_id, new Set(r.conditions ?? []));
  }

  const adviceConds = new Set(advice.condition_tags ?? []);
  const teaser = bodyExcerpt(advice.body_html);

  let sent = 0;
  let skipped = 0;
  for (const profile of (profilesRaw ?? []) as ProfileRow[]) {
    if (!planUnlocks(profile.plan, advice.plan_required)) {
      skipped++;
      continue;
    }
    // If the advice has condition tags, restrict to users who match
    // at least one. Untagged advice goes to everyone (general wellness).
    if (adviceConds.size > 0) {
      const userConds = conditionByUser.get(profile.id);
      const hit =
        userConds &&
        Array.from(adviceConds).some((c) => userConds.has(c));
      if (!hit) {
        skipped++;
        continue;
      }
    }

    await emailNotifyMember(supabase, profile.id, {
      kind: 'daily_advice',
      vars: { plantName: advice.plant_name, adviceExcerpt: teaser },
      requirePref: 'daily_advice_email',
    });
    sent++;
  }

  return NextResponse.json({
    ok: true,
    advice_id: advice.id,
    sent,
    skipped,
  });
}

// Accept GET too so an operator can curl the endpoint for a one-off
// manual blast from a dev machine. Same auth + same behavior.
export const GET = POST;
