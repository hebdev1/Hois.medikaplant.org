-- Course Q&A: a student asks a question about a course/lesson; an admin
-- ("Ton vye") answers. Students see only their own rows; admins read/answer via
-- the service role (bypasses RLS).
create table if not exists public.course_questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  answer text,
  answered_by uuid references auth.users(id),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_questions_course
  on public.course_questions(course_id, created_at desc);
create index if not exists idx_course_questions_user
  on public.course_questions(user_id);

alter table public.course_questions enable row level security;

drop policy if exists "course_questions_select_own" on public.course_questions;
create policy "course_questions_select_own" on public.course_questions
  for select using (user_id = auth.uid());
drop policy if exists "course_questions_insert_own" on public.course_questions;
create policy "course_questions_insert_own" on public.course_questions
  for insert with check (user_id = auth.uid());
