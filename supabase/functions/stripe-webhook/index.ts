// DEPRECATED — MedikaPlant uses mock checkout server-side, no Stripe yet.
//
// NOTE (exported 2026-07-22): this stub is still what is deployed, but it is
// superseded. Stripe webhooks are now handled by the Next.js route at
// app/api/webhooks/stripe/route.ts. This function can be removed once the
// Stripe endpoint in the dashboard is confirmed to point at the app.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: 'gone',
      message: 'This endpoint is deprecated and no longer in service.',
    }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  )
);
