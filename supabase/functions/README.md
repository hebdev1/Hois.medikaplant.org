# Edge Functions

Exported from the deployed Supabase project (`kmzmtuthwssyuoklmydy`) on
2026-07-22. Until then these existed **only** on Supabase and were not in
version control — if one had been deleted or changed there was no copy and no
history. Each directory here mirrors what is deployed under that slug.

## What is actually in use

| Function | JWT | State |
|---|---|---|
| `delete-user` | required | **Live.** A member deletes their own account: verifies the caller, requires the `DELETE MY ACCOUNT` phrase, clears their avatars from storage, then deletes the auth user (everything else follows via `ON DELETE CASCADE`). |
| `checkout` | required | **Superseded.** Wrote a subscription row after the old mock checkout. Plan purchases now go through Stripe (`app/checkout/elements-actions.ts`) and the row is written by `app/api/webhooks/stripe`. Kept for reference. |
| `stripe-webhook` | public | **Superseded stub** returning 410. Stripe webhooks are handled by `app/api/webhooks/stripe/route.ts`. |

## Deprecated stubs (410 Gone)

`cart`, `ai-chat`, `scan-plant`, `notifications`, `scraper`, `ingest`,
`auto-update`, `analytics`, `recommend`, `product-enrichment`.

These were inherited from an earlier project and are outside MedikaPlant's
scope. They were replaced with a stub that returns `410 Gone` so any stray
caller fails loudly rather than silently doing nothing. They remain deployed
only so the URLs do not 404 unexpectedly; they can be removed once nothing is
observed calling them.

## Keeping this in sync

These files are a mirror, not the deploy source — the app does not build them.
If you change a function in the Supabase dashboard, update the matching file
here in the same commit, or the drift starts again.
