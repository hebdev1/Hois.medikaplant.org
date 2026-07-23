// DEPRECATED — this edge function was inherited from an earlier project
// and is not part of the MedikaPlant naturopath SaaS surface. It now
// returns 410 Gone so any stray caller fails loudly.
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
