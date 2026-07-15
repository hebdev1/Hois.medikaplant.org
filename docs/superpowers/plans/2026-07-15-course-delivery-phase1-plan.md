# Implementation Plan — Course Delivery Phase 1 (Recorded)

Source spec: `docs/superpowers/specs/2026-07-15-course-delivery-design.md`
Scope: **Phase 1 only** — recorded delivery (external URL **or** private Supabase Storage) + gated "Kou mwen yo" member area. Phase 2 (Zoom API) is a separate later plan.

Each step lists the change and how to verify it. Build (`npm run build`) must stay green after every step.

---

## Step 1 — Migration: extend `course_modules`

- New migration `supabase/migrations/0XX_course_modules_video_source.sql`:
  - `alter table course_modules add column video_source text not null default 'external' check (video_source in ('external','storage'));`
  - `alter table course_modules add column video_path text;`
  - Backfill is implicit (default `'external'`; existing rows keep `video_url`).
- Apply to live DB; vendor the file.
- Regenerate `types/database.ts` for the new columns.
- **Verify:** columns present; `select video_source from course_modules limit 5` → all `'external'`.

## Step 2 — Private bucket `course-videos`

- Create a **private** Storage bucket `course-videos` (via migration `storage.buckets` insert or dashboard; vendor as SQL for reproducibility).
- Policies: authenticated **admins** may `insert`/`update`/`delete`; **no** public/anon `select`. Reads happen only via server-minted signed URLs.
- **Verify:** anon `getPublicUrl` / direct fetch of an object → denied; admin upload works.

## Step 3 — Access choke point `getModulePlayback`

- Server action (e.g. `app/dashboard/kou/actions.ts`): `getModulePlayback(moduleId)` implementing spec §4.2:
  1. get user; 2. load module (`course_id, preview, video_source, video_url, video_path`);
  3. `preview` → allow; 4. else verify enrolled (reuse existing gate: paid `course_purchases` row **or** `plan_required` covered by active plan) → else `{ locked: true }`;
  5. `storage` → `createSignedUrl(video_path, 7200)` → `{ kind:'file', url }`; `external` → `{ kind:'embed', url: video_url }`.
- **Verify:** anon & non-enrolled → `locked`; enrolled storage → signed URL that plays then 403s after expiry; external → embed URL.

## Step 4 — Admin: per-module source + upload

- `app/admin/(protected)/klas/modules-manager.tsx` + `actions.ts`: add a **source** control — *External URL* (existing `video_url`) or *Upload*. Upload streams the file to `course-videos`, stores the returned key in `video_path`, sets `video_source='storage'`.
- Keep http(s) validation for external. Enforce a documented file-size cap (see spec §8); steer larger files to the external-URL source for now.
- **Verify:** admin can save an external module and an uploaded module; `video_path` populated for the upload; both appear in the module list.

## Step 5 — Member area "Kou mwen yo"

- `app/dashboard/kou/page.tsx` — lists courses the user is enrolled in (paid or plan-covered), with cover + progress-agnostic "Kontinye" link.
- `app/dashboard/kou/[slug]/page.tsx` — enrollment-gated (non-enrolled → redirect to `/klas/[slug]`). Renders the module list + a client `CourseVideoPlayer`.
- `components/dashboard/course-video-player.tsx` (client) — on play, calls `getModulePlayback(moduleId)`; renders `<video src>` (file) or a sanitized provider embed (external); on playback error/expiry, re-fetches once.
- Add a "Kou mwen yo" entry to the dashboard sidebar/nav.
- **Verify:** enrolled user sees the course, plays a storage module and an external module; non-enrolled is redirected; deep-linking a locked module via the action returns `locked`.

## Step 6 — Column hygiene

- Audit public catalog/detail queries (`app/klas/page.tsx`, `app/klas/[slug]/page.tsx`): they must select `video_url`/`video_path` **only** for `preview` modules; full source for non-preview flows solely through `getModulePlayback`.
- **Verify:** view-source / network on a public course page exposes no non-preview video source.

## Step 7 — Acceptance + ship

- Run the spec §9 acceptance checks end-to-end on the dev server (anon, non-enrolled, enrolled, admin upload).
- `npm run build` green; commit + push each coherent step.

---

### Notes
- No `service_role` in client; signed URLs short-lived; bucket private (spec §7).
- Monitor Supabase egress once real videos are served (spec §8).
- Phase 2 (Zoom Server-to-Server OAuth + `course_sessions` + "Antre" UI) gets its own spec + plan.
