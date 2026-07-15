# Course Delivery — Design Spec

- **Date:** 2026-07-15
- **Status:** Approved (brainstorming) — ready for implementation plan
- **Topic:** Selling courses that are delivered either as pre-recorded video or live Zoom sessions, with an enrolled-student consumption area.

## 1. Context / current state

The platform already has:

- **Catalog + detail**: `app/klas/page.tsx`, `app/klas/[slug]/page.tsx`.
- **Curriculum**: `course_modules` (`id, display_order, title, description, duration_text, video_url, resource_links, preview`). Only `preview` modules expose their `video_url` publicly.
- **Delivery mode**: `courses.format` (`video` | `live_zoom` | `hybrid`) + course-level `zoom_url` + `zoom_schedule` (jsonb `{text}`).
- **Enrollment / sales**: plan-gate + paid courses (`course_purchases`, migration 071), `seat_capacity`, `alreadyEnrolled`, `EnrollButton`, `/checkout/klas/[slug]`.

**The gap:** there is **no enrolled-student area** where a buyer actually (a) watches the full (non-preview) recorded videos, or (b) joins the live Zoom session. Delivery data exists; the delivery *experience* does not.

## 2. Goals / non-goals

**Goals**
- Sell courses; each course is delivered as **pre-recorded video** and/or **live Zoom**, both options available per course.
- Pre-recorded video supports **two sources**: an **external URL** (YouTube/Vimeo/etc.) or a **self-hosted file in Supabase Storage** (private, signed URLs).
- Live Zoom sessions are **auto-created via the Zoom API** (Server-to-Server OAuth).
- An enrolled-student **"Kou mwen yo"** area to consume both, gated by enrollment.

**Non-goals (YAGNI for now)**
- Progress tracking / completion %, certificates, quizzes.
- DRM beyond private bucket + short-lived signed URLs.
- Per-student unique Zoom registrant links (Phase 2 may add later).
- Third-party LMS (Teachable/Thinkific) — rejected: fragments the custom, Kreyòl-first platform.

## 3. Confirmed decisions

| Axis | Decision |
|---|---|
| Structure | **Approach B** — `course_sessions` (live) + `course_modules` (recorded), unified in "Kou mwen yo" |
| Recorded hosting | **Dual-source**: external URL **or** self-hosted Supabase Storage (private bucket, signed expiring URLs) |
| Live Zoom | **Auto-create meetings via Zoom API** (Server-to-Server OAuth) |
| Build strategy | **2 phases** — Phase 1 recorded (no external dependency, start selling), Phase 2 live Zoom API |

## 4. Architecture

### 4.1 Data model

**`course_modules`** (extend, Phase 1) — migration adds:
- `video_source text not null default 'external'` — check in (`'external'`, `'storage'`).
- `video_path text` — Supabase Storage object key when `video_source = 'storage'` (nullable).
- Keeps `video_url` (used when `video_source = 'external'`) and `preview`.
- Backfill: existing rows → `video_source = 'external'` (they already carry `video_url`).

**`course_sessions`** (new, Phase 2):
- `id, course_id (fk), title, starts_at timestamptz, duration_minutes int`
- `zoom_meeting_id text, zoom_join_url text, zoom_start_url text` (start_url is the host link — **never** exposed to students)
- `created_at`.

**Storage**: private bucket **`course-videos`** — no public read. Uploads by admins only; reads only through short-lived signed URLs minted server-side after an enrollment check.

### 4.2 Access control (the core security unit)

Server action **`getModulePlayback(moduleId)`** — single choke point for playback access:
1. Resolve the current user.
2. Load the module + its `course_id`, `preview`, `video_source`, `video_url`, `video_path`.
3. If `preview` → allowed (public marketing preview).
4. Else → verify the user is **enrolled** in the course (reuse the existing enrollment gate: a paid `course_purchases` row **or** the course's `plan_required` is covered by the user's active plan). If not enrolled → return `{ locked: true }` (UI shows the buy/upgrade CTA).
5. If enrolled:
   - `video_source = 'storage'` → `supabase.storage.from('course-videos').createSignedUrl(video_path, 7200)` → return `{ kind: 'file', url }`.
   - `video_source = 'external'` → return `{ kind: 'embed', url: video_url }`.

**Column hygiene:** the public catalog/detail queries must **not** select `video_path`/`video_url` for non-preview modules. Full source is only ever returned by `getModulePlayback` after the enrollment check. RLS on `course_modules` stays read-only for metadata; the raw signed URL is never in a client-readable column.

### 4.3 Delivery flows

- **Recorded (Phase 1):** enrolled student → "Kou mwen yo" → course → module list → click a module → client player calls `getModulePlayback` → plays `<video>` (file) or renders an embed (external).
- **Live (Phase 2):** enrolled student → course → sees upcoming `course_sessions` with an **"Antre"** button (`zoom_join_url`) that activates near start time. Session recording can later be uploaded as a `storage` module (true hybrid).

## 5. Phase 1 — Recorded delivery (detailed)

1. **Migration**: extend `course_modules` (`video_source`, `video_path`) + backfill.
2. **Bucket**: create private `course-videos`; policies allow admin write, no public read.
3. **Admin (`modules-manager` / course form)**: per module choose **source** — *External URL* (existing `video_url` input) or *Upload* (file → `course-videos` → store `video_path`). Keep the http(s) validation for external. Enforce a file-size cap (see §8).
4. **Access action**: `getModulePlayback(moduleId)` as in §4.2.
5. **Member area**:
   - `/dashboard/kou` — list courses the user is enrolled in.
   - `/dashboard/kou/[slug]` — enrollment-gated (non-enrolled → redirect to `/klas/[slug]` to buy). Renders module list + a client `CourseVideoPlayer` that resolves playback lazily on play, and re-fetches if a signed URL expires mid-session.
6. **Result**: recorded courses are fully sellable and consumable with no external dependency.

## 6. Phase 2 — Live Zoom (outline)

- `course_sessions` table.
- **Zoom Server-to-Server OAuth** app → env `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` (server-only). Token fetched server-side; `POST /users/me/meetings` to create; store `meeting_id`, `join_url`, `start_url`.
- Admin "live session" manager: add a session (date/time) → auto-creates the meeting.
- "Kou mwen yo": show upcoming sessions + gated **"Antre"** (`join_url`).
- Optional later: `meeting.ended` webhook → attach cloud recording as a `storage` module.

## 7. Security

- `service_role` never in client code; anon key + RLS remain the only client path.
- `course-videos` bucket is **private**; playback only via short-lived signed URLs from `getModulePlayback` after enrollment check.
- `zoom_start_url` (host link) is never selected into any student-facing query.
- Zoom + storage secrets live only in the hosting env (Hostinger) / Supabase secrets.

## 8. Edge cases / considerations

- **Supabase egress/bandwidth cost**: self-hosted video streaming consumes egress — monitor; large libraries may warrant a CDN/stream host later.
- **Upload size limits**: Supabase default per-file limit is small; raise the bucket limit and/or use resumable (tus) upload for large files, or cap Phase-1 uploads to a documented size and steer big videos to the external-URL source.
- **Signed URL expiry vs long videos**: 2h expiry covers most; the player re-issues a URL on playback error/expiry.
- **External embeds**: sanitize/normalize provider URLs (YouTube/Vimeo → embed form); external links remain shareable by nature (accepted for that source).

## 9. Testing (acceptance)

- Anon / non-enrolled user **cannot** obtain a signed URL for a non-preview module (gets `locked`).
- Enrolled user gets a signed URL that plays and expires; re-issue works.
- External-URL module renders as an embed for enrolled users.
- Public detail page still shows only `preview` module videos.
- Admin upload stores `video_path` and plays back in "Kou mwen yo".
- (Phase 2) Publishing a live session creates a Zoom meeting; `start_url` never reaches the client.

## 10. Rollout

1. Phase 1 migration + bucket + access action + admin upload + "Kou mwen yo" → verify → ship → begin selling recorded courses.
2. Phase 2 Zoom Server-to-Server OAuth + `course_sessions` + join UI → verify → ship.
