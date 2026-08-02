# Implementation Plan — Live Zoom Per-Student Links (Phase 2)

Source spec: `docs/superpowers/specs/2026-08-02-live-zoom-per-student-design.md`
Scope: auto-register each enrolled student with Zoom (Server-to-Server OAuth) → personal join link, access control, in-platform attendance, Zoom-native emails; recurring + one-off sessions. Layered on top of the shipped Phase 1 (course-level `zoom_url` stays as fallback).

Build (`npm run build`) and `tsc --noEmit` must stay green after every step. Steps 1–5 = **core** (goals: access control + personal links + emails). Step 6 = **attendance**. Each step lists the change and how to verify it.

New tables aren't in generated types → server code casts `(supabase as any)` (existing project pattern). All Zoom calls and DB writes to the new tables run **server-side only**.

---

## Step 0 — Prerequisite (owner-performed, guided): Zoom app + env

Blocks live verification of Steps 2–4 (code can be written first; live testing needs this).

- In the Zoom App Marketplace (Zoom Pro account owner), create a **Server-to-Server OAuth** app → copy **Account ID, Client ID, Client Secret**.
- Grant scopes: create/read meetings, add/read meeting **registrants**, read meeting **participant reports**, read user. Activate the app.
- Set env vars in **Hostinger runtime env** and local **`.env.local`**: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.
- (Optional) enable "send reminder email to registrants" in Zoom email settings.
- **Verify:** a throwaway server call (Step 2's `getAccessToken()`) returns a token.

## Step 1 — Migration: `course_sessions` + `course_session_registrants`

- New migration `supabase/migrations/1XX_course_sessions.sql` (next free number, ≥ 106):
  - `course_sessions` per spec §5.1: `id, course_id fk cascade, title, session_type check('recurring','single'), starts_at timestamptz, duration_minutes int default 90, timezone text default 'America/Port-au-Prince', recurrence jsonb, schedule_text text, zoom_meeting_id text, zoom_start_url text, status check('scheduled','ended','cancelled') default 'scheduled', created_at`. Index `(course_id, starts_at)`.
  - `course_session_registrants` per spec §5.1: `session_id fk cascade, user_id fk cascade, zoom_registrant_id text, join_url text, registered_at, attended bool default false, attended_minutes int`, pk `(session_id, user_id)`.
  - `enable row level security` on both. Policies (idempotent `do $$ … duplicate_object` guards, per repo convention):
    - registrants: SELECT `using (auth.uid() = user_id)`. No client insert/update/delete (writes via service role).
    - sessions: SELECT to authenticated users enrolled in the course (metadata read); no client writes. `zoom_start_url` protected by query discipline (never selected client-side) — see Step 5.
- Apply to live DB (`apply_migration`), vendor the file in `supabase/migrations/`, regenerate `types/database.ts`.
- **Verify:** both tables + RLS present; as a normal user, selecting `course_session_registrants` returns only own rows; `select` on `course_sessions` works for enrolled test user.

## Step 2 — Zoom API client `lib/zoom/`

- `lib/zoom/client.ts`: `getAccessToken()` — `POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id=…` with `Authorization: Basic base64(client_id:client_secret)`; cache token in module memory ~55 min. `zoomFetch(path, init)` wrapper: attaches bearer token, one retry on 401 (refresh), throws a sanitized error (never leaks secret/token). Throws a clear error if env vars are missing.
- `lib/zoom/meetings.ts`: `createMeeting(input)` (`POST /users/me/meetings`, spec §5.3 settings: `approval_type:0`, recurring `type:8` + `recurrence` + `registration_type:2`, single `type:2`), `deleteMeeting(id)`, `addRegistrant(meetingId, {first_name,last_name,email})` → returns `{registrant_id, join_url}`, `listPastInstances(id)`, `getParticipants(meetingUuid)` (double-encode UUIDs containing `/`).
- These modules are **server-only**; never import from a client component.
- **Verify:** `tsc`/build green; with Step 0 env set, a temporary server route creates then deletes a test meeting; token is reused across calls.

## Step 3 — Admin: session manager (create / delete)

- `app/admin/(protected)/klas/[id]/session-actions.ts`:
  - `createCourseSession(courseId, input)` — assert admin → insert `course_sessions` row → `createMeeting` → persist `zoom_meeting_id` + `zoom_start_url`. On Zoom failure: delete the half-created row and return `{error}`.
  - `deleteCourseSession(sessionId)` — assert admin → `deleteMeeting` → delete row (registrants cascade).
- UI: a **"Sesyon an dirèk"** section in the course editor (`app/admin/(protected)/klas/[id]`), shown only when `format ∈ {live_zoom, hybrid}`: session list (title, date/time in Haiti tz, type, # registered), **"Ajoute yon sesyon"** form (type, date+time, duration, timezone default Haiti; recurring → weekday picker + end date/occurrences + `schedule_text`), delete, and **"Louvri kòm animatè"** (opens `zoom_start_url`, admin only).
- **Verify:** admin creates one recurring + one single session → Zoom meetings created, `zoom_meeting_id`/`zoom_start_url` stored; host link opens; delete removes the Zoom meeting and the row.

## Step 4 — Student: personal join link (lazy registration)

- `app/aprann/[slug]/session-actions.ts`: `getSessionJoinLink(sessionId)` (spec §5.4) — resolve user → verify enrollment in the session's course → return existing registrant `join_url`, else `addRegistrant` with the student's **profile** first/last name + email (placeholder first name if missing), store the registrant row, return `join_url`. Never accepts a client-supplied email.
- `components/klas/live-sessions.tsx` (shared, client): lists upcoming sessions with Haiti-time date + `schedule_text`; on first view lazily calls `getSessionJoinLink` (spinner) then shows **"Antre nan Zoom"** → personal `join_url`, activating ~15 min before `starts_at` and during; past sessions show "fini"; note "lyen pèsonèl ou — pa pataje l".
- Wire into **both** `app/aprann/[slug]/page.tsx` and `app/dashboard/klas/[slug]/page.tsx`: when the course has ≥1 session, render `live-sessions` (supersedes the legacy course-level Zoom block); otherwise keep the existing `zoom_url` block (fallback intact).
- **Verify:** two enrolled test users get two **different** `join_url`s; non-enrolled/anon → `locked`; Zoom confirmation email arrives; a course with no sessions still shows the legacy block.

## Step 5 — Security / column hygiene

- Audit every student-facing query touching `course_sessions` (in `/aprann/[slug]`, `/dashboard/klas/[slug]`, and `live-sessions` data loads): select the explicit safe column list only (spec §5.2) — **never** `zoom_start_url`. Only admin/service reads it.
- Confirm `lib/zoom/*` is never imported by a client bundle; secrets only in server env.
- **Verify:** view-source + network tab on a student course page expose no `zoom_start_url` and no Zoom token/secret; only admin sees the host link.

--- core (Steps 1–5) shippable here: access control + personal links + emails ---

## Step 6 — Attendance sync + roster

- `syncSessionAttendance(sessionId)` (admin action): `listPastInstances` → for each occurrence `getParticipants` → match `user_email` to registrants → update `attended` (+`attended_minutes`).
- Admin roster UI per session: present/absent list + minutes, **"Rafrechi prezans"** button.
- **Verify:** after a real/test session with 2 joiners, sync marks exactly those students present with sensible minutes; absentees stay false.

## Step 7 — Acceptance + ship

- Run spec §10 acceptance checks end-to-end on the dev server (anon, non-enrolled, two enrolled, admin create/delete, recurring vs single, attendance).
- `npm run build` + `tsc --noEmit` green; commit + push each coherent step; confirm Zoom env vars are set on Hostinger before the deploy that ships Steps 3–4.

---

### Notes
- Step 0 (Zoom app + env) gates live testing of Steps 2–4 — do it before those steps' "Verify".
- Secrets server-only; token cached in memory; `zoom_start_url` never client-exposed (spec §6).
- Zoom Pro meeting capacity ~100; `courses.seat_capacity` already caps enrollment (spec §7).
- Store `starts_at` UTC; display Haiti time; pass `timezone` to Zoom.
- Recurring uses `registration_type: 2` (one personal link for the whole series).
