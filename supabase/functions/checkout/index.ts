// MedikaPlant — checkout edge function (dual billing cycle)
//
// Atomic subscription creation. Accepts plan + billing_cycle, resolves
// the price SERVER-SIDE from the subscription_plans table via the
// get_plan_price RPC — the client cannot tamper with the amount it ends
// up paying. The yearly cycle gets the 10% discount baked into the
// stored discounted price; monthly is yearly_original / 12, no discount.
//
// Body: { plan: 'basic'|'premium'|'vip', billing_cycle: 'monthly'|'yearly', payment_reference?: string }
//
// NOTE (exported 2026-07-22): the app no longer calls this. Plan purchases
// now go through Stripe (app/checkout/elements-actions.ts) and the
// subscription row is written by app/api/webhooks/stripe. Kept deployed for
// reference; retire once Stripe is confirmed live.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type Plan  = 'basic' | 'premium' | 'vip';
type Cycle = 'monthly' | 'yearly';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  const jwt = authHeader.slice('Bearer '.length);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await authClient.auth.getUser(jwt);
  if (userErr || !user) return json({ error: 'Invalid session' }, 401);

  let body: { plan?: string; billing_cycle?: string; payment_reference?: string } = {};
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const plan = body.plan as Plan;
  if (plan !== 'basic' && plan !== 'premium' && plan !== 'vip') {
    return json({ error: 'Plan ki chwazi a pa valid.' }, 400);
  }

  const cycle = (body.billing_cycle ?? 'yearly') as Cycle;
  if (cycle !== 'monthly' && cycle !== 'yearly') {
    return json({ error: 'Sik fakti a pa valid.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // ── Resolve the canonical price server-side. Never trust the client.
  const { data: priceRaw, error: priceErr } = await admin
    .rpc('get_plan_price', { p_plan: plan, p_cycle: cycle });
  if (priceErr || priceRaw == null) {
    return json({ error: `Could not resolve price: ${priceErr?.message ?? 'unknown'}` }, 500);
  }
  const amount = Number(priceRaw);

  // ── Cancel any current active sub. Trigger reconciles profile.plan.
  await admin.from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const startDate = new Date();
  const endDate = new Date(startDate);
  // Monthly = +1 month, yearly = +12 months. The yearly discount is
  // already in `amount`; nothing else needs to know about it.
  endDate.setMonth(endDate.getMonth() + (cycle === 'yearly' ? 12 : 1));

  const reference = body.payment_reference
    ?? `mock_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  const { data: inserted, error: insertErr } = await admin
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan,
      billing_cycle: cycle,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      amount,
      payment_reference: reference,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    return json({ error: `Subscription insert failed: ${insertErr?.message ?? 'unknown'}` }, 500);
  }

  // In-app notification so the bell wakes up.
  await admin.from('notifications').insert({
    title: 'Plan ou aktif!',
    message: `Mèsi pou abònman ou nan plan ${plan} (${cycle === 'yearly' ? 'pa ane' : 'pa mwa'}). Tout sa plan an ofri disponib kounye a.`,
    target: 'user',
    target_user_id: user.id,
    link_url: '/dashboard',
  });

  return json({
    ok: true,
    subscription_id: (inserted as { id: string }).id,
    plan,
    billing_cycle: cycle,
    amount,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    payment_reference: reference,
  });
});
