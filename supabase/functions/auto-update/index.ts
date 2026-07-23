// DEPRECATED — auto-update job not part of MedikaPlant scope.
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
