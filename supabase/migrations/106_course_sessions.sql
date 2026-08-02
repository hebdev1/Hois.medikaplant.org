-- Live Zoom sessions with per-student registrant links (Phase 2).
--
-- A course can have recurring or one-off live sessions. Each enrolled student
-- is auto-registered with Zoom (Server-to-Server OAuth) and gets a personal
-- join link. Admin writes go through the service role (bypasses RLS). Students
-- read session metadata for courses they're enrolled in — but NEVER the host
-- start_url (withheld at the column level below) — and only their own
-- registrant row (their personal join_url).

create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  session_type text not null default 'single'
    check (session_type in ('recurring', 'single')),
  starts_at timestamptz not null,
  duration_minutes int not null default 90,
  timezone text not null default 'America/Port-au-Prince',
  recurrence jsonb,
  schedule_text text,
  zoom_meeting_id text,
  zoom_start_url text,               -- host link; NEVER exposed to students
  status text not null default 'scheduled'
    check (status in ('scheduled', 'ended', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_course_sessions_course
  on public.course_sessions(course_id, starts_at);

create table if not exists public.course_session_registrants (
  session_id uuid not null references public.course_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  zoom_registrant_id text,
  join_url text,                     -- the student's personal join link
  registered_at timestamptz not null default now(),
  attended boolean not null default false,
  attended_minutes int,
  primary key (session_id, user_id)
);

create index if not exists idx_course_session_registrants_user
  on public.course_session_registrants(user_id);

alter table public.course_sessions enable row level security;
alter table public.course_session_registrants enable row level security;

-- Students may read session metadata for courses they're enrolled in. Combined
-- with the column grant below, a hand-crafted client query still cannot read
-- zoom_start_url — only the service role can.
drop policy if exists "course_sessions_select_enrolled" on public.course_sessions;
create policy "course_sessions_select_enrolled" on public.course_sessions
  for select using (
    exists (
      select 1 from public.course_enrollments e
      where e.course_id = course_sessions.course_id
        and e.user_id = auth.uid()
    )
  );

-- Column-level hygiene: withhold the host start_url (and internal meeting id)
-- from client roles. The service role bypasses grants + RLS for admin reads.
revoke select on public.course_sessions from anon, authenticated;
grant select (
  id, course_id, title, session_type, starts_at, duration_minutes,
  timezone, recurrence, schedule_text, status, created_at
) on public.course_sessions to authenticated;

-- Each student sees only their own registrant row (their personal join_url).
drop policy if exists "course_session_registrants_select_own"
  on public.course_session_registrants;
create policy "course_session_registrants_select_own"
  on public.course_session_registrants
  for select using (user_id = auth.uid());

-- No insert/update/delete policies on either table → clients cannot write;
-- all writes (create meeting, register student, record attendance) run through
-- the service role in server actions.
