// DEPRECATED — MedikaPlant uses real-time support chat between admins and
// members via the support_threads tables, not an AI chat backend.
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
