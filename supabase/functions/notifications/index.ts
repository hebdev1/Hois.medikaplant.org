// DEPRECATED — notifications are now produced by database triggers and
// delivered to members via Supabase Realtime. No edge function needed.
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
