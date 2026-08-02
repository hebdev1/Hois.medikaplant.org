# Live Zoom — Per-Student Links (Phase 2) — Design Spec

- **Date:** 2026-08-02
- **Status:** Approved (brainstorming) — ready for implementation plan
- **Topic:** Live Zoom course sessions where **each enrolled student gets their own personal join link**, delivered via the Zoom API. Extends the 2026-07-15 course-delivery design (which shipped Phase 1: course-level `zoom_url` + recorded video). This is the "per-student registrant links" that the earlier doc listed as *"Phase 2 may add later"*.

## 1. Plain-language summary (for non-technical review)

Today a live course has **one shared Zoom link** pasted by hand — everyone clicks the same link and lands in the same room. This feature makes the platform **register each paying student with Zoom automatically**, so every student gets **their own personal link**. Benefits, all three requested:

1. **Only payers get in** — a non-buyer never receives a link; a shared link won't admit an unregistered person.
2. **Attendance** — because each link is tied to one student, the admin can see exactly who attended each session.
3. **Automatic emails** — Zoom sends each student a confirmation + reminders with their personal link.

Supports **both** session styles per course: **recurring** (same weekly time → one personal link covering all sessions) and **one-off dated** sessions.

**Prerequisite (already confirmed):** a paid **Zoom Pro** account (registration + reporting APIs require it).

## 2. Context / current state

Shipped in Phase 1 (see `2026-07-15-course-delivery-design.md`):

- `courses.format` (`video | live_zoom | hybrid | interactive`), course-level `courses.zoom_url` + `courses.zoom_schedule` (`{text}`).
- Admin course form exposes format + a single Zoom link + schedule text (`app/admin/(protected)/klas/course-form.tsx`, `actions.ts`).
- Student join block (one shared link) rendered in **both** `app/aprann/[slug]/page.tsx` and `app/dashboard/klas/[slug]/page.tsx` (`isLive` → "Sesyon an dirèk" → "Antre nan Zoom").
- Enrollment gate: a paid `course_purchases` row **or** the course's `plan_required` covered by the member's active plan.

**The gap:** the live link is one shared URL, manually managed. No per-student link, no access control beyond secrecy of the URL, no attendance.

## 3. Goals / non-goals

**Goals**
- Per-enrolled-student **personal Zoom join link** via the Zoom API (Server-to-Server OAuth).
- Support **recurring** and **one-off** sessions per course (admin chooses per session).
- **Access control:** only enrolled (paid/plan-covered) students are ever registered.
- **Attendance:** admin can see who attended each session (in-platform roster).
- **Automatic emails:** Zoom-native registrant confirmation + reminder emails.
- Keep the existing simple **course-level shared link** working as a fallback (non-breaking).

**Non-goals (YAGNI)**
- Embedding the Zoom Web SDK in-page (students join in the Zoom app/browser as normal).
- Real-time attendance during a session (attendance is pulled after the session).
- Per-occurrence attendance dashboards beyond a simple present/absent (+minutes) roster.
- Automated recording→module attach (already covered as a later idea in the Phase-1 doc; out of scope here).

## 4. Confirmed decisions

| Axis | Decision |
|---|---|
| Mechanism | **Approach A** — automatic API registration of each enrolled student (`POST /meetings/{id}/registrants`) → personal `join_url` |
| Session model | **Both** `recurring` and `single`, chosen per session by the admin |
| Recurring links | Zoom **register-once-attend-all** (`registration_type: 2`) → one personal link per student for the whole series |
| Registration timing | **Lazy** — a student is registered the first time they view/click the session (handles enrollments that happen after the meeting is created) |
| Attendance source | Zoom **participant report** (`/report/meetings/.../participants`), pulled on demand by the admin |
| Emails | **Zoom-native** registrant confirmation + reminders (meeting email settings) |
| Secrets | Zoom S2S OAuth creds are **server-only** env vars; never in client code |
| Fallback | Course-level `zoom_url` stays; sessions **supersede** it when present |

## 5. Architecture

### 5.1 Data model (new migration)

**`course_sessions`**
- `id uuid pk default gen_random_uuid()`
- `course_id uuid not null references courses(id) on delete cascade`
- `title text not null`
- `session_type text not null check (session_type in ('recurring','single'))`
- `starts_at timestamptz not null` — first (or only) occurrence start, stored UTC
- `duration_minutes int not null default 90`
- `timezone text not null default 'America/Port-au-Prince'`
- `recurrence jsonb` — recurring only: `{ weekly_days:[3,5], repeat_interval:1, end_date:'YYYY-MM-DD' | occurrences:int }` (Zoom weekday codes Sun=1…Sat=7)
- `schedule_text text` — friendly display, e.g. `"Chak Madi ak Jedi 7pm Ayiti · 90 min"`
- `zoom_meeting_id text` — Zoom numeric id (stored as text)
- `zoom_start_url text` — **host link; NEVER exposed to students** (admin/service reads only)
- `status text not null default 'scheduled' check (status in ('scheduled','ended','cancelled'))`
- `created_at timestamptz not null default now()`
- Index: `(course_id, starts_at)`.

**`course_session_registrants`**
- `session_id uuid not null references course_sessions(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `zoom_registrant_id text`
- `join_url text` — the student's **personal** join link
- `registered_at timestamptz not null default now()`
- `attended boolean not null default false`
- `attended_minutes int`
- primary key `(session_id, user_id)`

Both new tables are absent from generated types → server code casts `(supabase as any)` per the existing project pattern.

### 5.2 RLS + column hygiene (core safety)
- **Writes** to both tables happen **only** through server actions using the **service-role client**, after an explicit admin (writes to `course_sessions`) or enrollment (registrant insert) check. No client writes.
- `course_session_registrants`: `enable row level security`; SELECT policy `auth.uid() = user_id` so a student can read **only their own** row (their `join_url`). Admin roster reads use the service client.
- `course_sessions`: `enable row level security`. Student-facing reads select an **explicit safe column list only** — `id, course_id, title, session_type, starts_at, duration_minutes, timezone, schedule_text, status` — and **never** `zoom_start_url`. `zoom_start_url` is selected exclusively by admin/service reads. (Mirrors the Phase-1 "never selected into any student-facing query" rule for `video_path`.)

### 5.3 Zoom integration (server-only) — `lib/zoom/`
- **`getAccessToken()`** — Server-to-Server OAuth: `POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id={ZOOM_ACCOUNT_ID}` with header `Authorization: Basic base64(ZOOM_CLIENT_ID:ZOOM_CLIENT_SECRET)`. Cache the token in module memory ~55 min (`expires_in` is 3600s).
- **`createMeeting(session)`** — `POST /users/me/meetings`:
  - `type: 2` (single) or `type: 8` (recurring, fixed time).
  - `start_time` (ISO8601), `duration`, `timezone`.
  - recurring: `recurrence: { type:2 weekly, repeat_interval, weekly_days:"3,5", end_date_time|end_times }`.
  - `settings`: `approval_type: 0` (auto-approve — this is what enables registration), `registration_type: 2` for recurring (register once, attend all), plus `join_before_host: false`, `waiting_room: false`, `meeting_authentication: false`.
  - Store `id → zoom_meeting_id` and `start_url → zoom_start_url`.
- **`addRegistrant(meetingId, {first_name,last_name,email})`** — `POST /meetings/{id}/registrants`. Returns `registrant_id` + personal `join_url`. For a recurring meeting with `registration_type: 2`, one call (no `occurrence_ids`) covers all occurrences. Zoom emails the student automatically.
- **`getParticipants(meetingId)`** — attendance: list past instances `GET /past_meetings/{id}/instances` → for each occurrence UUID (double-URL-encode UUIDs containing `/`), `GET /report/meetings/{uuid}/participants?page_size=300`. Match `user_email` → student. (Single meeting: report by `meetingId` directly.)
- **`deleteMeeting(meetingId)`** — `DELETE /meetings/{id}`.
- All calls: 1 retry on 401 (refresh token) and graceful error surfacing (never leak the token/secret to the client).

**Zoom OAuth scopes** to grant on the app: create/read meetings, add/read meeting registrants, and read meeting participant reports (plus `user:read` to resolve `/users/me`). Exact granular slugs are set during app setup (§8).

### 5.4 Server actions (choke points)
- **Admin — `createCourseSession(courseId, input)`** (`app/admin/(protected)/klas/.../session-actions.ts`): assert admin → insert `course_sessions` row → `createMeeting` → persist `zoom_meeting_id`/`zoom_start_url`. On Zoom failure: delete the half-created row (or mark `status` error) and return a message.
- **Admin — `deleteCourseSession(sessionId)`**: assert admin → `deleteMeeting` → delete row (registrants cascade).
- **Admin — `syncSessionAttendance(sessionId)`**: assert admin → `getParticipants` → match emails to registrants → update `attended` (+`attended_minutes`).
- **Student — `getSessionJoinLink(sessionId)`** (`app/aprann/[slug]/session-actions.ts`): resolve user → verify enrollment in the session's course → if a registrant row exists, return its `join_url`; else `addRegistrant` with the student's **profile** name+email, store the row, return `join_url`. Never accepts a client-supplied email.

### 5.5 Admin experience
A **"Sesyon an dirèk"** manager, shown only when `format ∈ {live_zoom, hybrid}` (a tab/section in the course editor at `app/admin/(protected)/klas/[id]`):
- List sessions: title, date/time (Haiti tz), type, # registered, # attended.
- **"Ajoute yon sesyon"**: title, type (recurring/single), date+time, duration, timezone (default Haiti); recurring adds weekday picker + end date/occurrences + `schedule_text`. Save → creates the Zoom meeting.
- Per session: **"Louvri kòm animatè"** (opens `zoom_start_url`, admin only), **"Wè/Rafrechi prezans"** (calls `syncSessionAttendance`, shows present/absent roster).

### 5.6 Student experience
A shared **`components/klas/live-sessions.tsx`** used by **both** `/aprann/[slug]` and `/dashboard/klas/[slug]` (replaces the single shared-link block when the course has sessions; otherwise the existing course-level `zoom_url` block still renders as fallback):
- Upcoming sessions with date/time in Haiti time + `schedule_text`.
- On first view of a session, lazily register (brief spinner via `getSessionJoinLink`), then show **"Antre nan Zoom"** → the student's personal `join_url`. Button activates ~15 min before `starts_at` and during the session.
- Note "lyen pèsonèl ou — pa pataje l". Past sessions show "fini".

## 6. Security
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` live only in server env; token fetched + cached server-side; never shipped to the client.
- `zoom_start_url` (host link) is never selected into any student-facing query and never returned by a student action — admin/service only.
- A student reads only their **own** `join_url` (RLS `auth.uid() = user_id` + enrollment check in the action).
- Registration always uses the student's stored profile email — no client-supplied identity.
- `service_role` stays server-only; the anon key + RLS remain the sole client path.
- Zoom/API failures degrade gracefully (page shows "lyen ap disponib byento"; admin can retry) and never surface secrets.

## 7. Edge cases / considerations
- **Enroll after meeting created** → lazy registration covers it on first view.
- **Recurring** → single registration returns one link for the whole series (`registration_type: 2`).
- **Attendance for recurring** → iterate past-occurrence UUIDs; encode UUIDs containing `/` (`//` → double-encode) before the report call.
- **Capacity** → Zoom Pro meetings cap ~100 participants; note in admin help. `courses.seat_capacity` already caps enrollment.
- **Deleting a session** → also deletes the Zoom meeting; registrants cascade.
- **Timezone** → store `starts_at` as UTC `timestamptz`; display in Haiti time; pass `timezone` to Zoom.
- **Email/reminder settings** → confirmation is default; reminder emails require the meeting/account "send reminder to registrants" setting enabled (Zoom-side, one-time).
- **Profile without name** → fall back to a placeholder first name + the email (Zoom requires first_name + email).

## 8. One-time setup (owner-performed, guided)
1. In the Zoom App Marketplace (Zoom Pro account owner), create a **Server-to-Server OAuth** app → copy **Account ID, Client ID, Client Secret**.
2. Add scopes: create/read meetings, add/read meeting **registrants**, read meeting **participant reports**, read user. Activate the app.
3. Set env vars `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`:
   - **Hostinger** runtime environment (server reads them at runtime),
   - **`.env.local`** for local dev,
   - GitHub repo secrets only if the deploy build needs them (runtime-only ⇒ Hostinger env is the key place).
4. (Optional) Enable "send reminder email to registrants" in Zoom meeting/account email settings.

A step-by-step screenshot-level guide will accompany implementation.

## 9. Build phasing (one spec, two steps)
- **Step 1 — core:** migration (both tables + RLS) · `lib/zoom` (token, createMeeting, addRegistrant, deleteMeeting) · admin session manager (create/delete) · student `live-sessions` component + `getSessionJoinLink` · Zoom-native emails. → Delivers **access control + personal links + emails** (goals 1 & 3).
- **Step 2 — attendance:** `getParticipants` + `syncSessionAttendance` + admin roster (present/absent, minutes). → Delivers **attendance** (goal 2).

## 10. Testing (acceptance)
- A non-enrolled / anon user calling `getSessionJoinLink` gets `locked` — never a link.
- Two different enrolled students receive two **different** `join_url`s.
- `zoom_start_url` never appears in any student-facing response or page source.
- Admin creates a **recurring** session → a Zoom meeting is created with registration on; a student is registered once and the same personal link works across occurrences.
- Admin creates a **single** session → distinct meeting; personal links issued.
- `syncSessionAttendance` marks the correct students present (matched by email) with minutes.
- Deleting a session removes the Zoom meeting and its registrants.
- A course with **no** sessions still shows the legacy course-level shared-link block (fallback intact).

## 11. Rollout
1. Step 1 migration + `lib/zoom` + admin create/delete + student join UI → verify on a test course with a real Zoom Pro meeting → ship.
2. Step 2 attendance sync + roster → verify → ship.
3. Keep the course-level `zoom_url` fallback until every live course uses sessions.
