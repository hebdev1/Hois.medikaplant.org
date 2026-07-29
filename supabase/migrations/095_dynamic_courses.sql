-- Dynamic interactive courses: a course "kind", structured JSON content for
-- overview + per-module lessons/quizzes, and saved per-member progress.

alter table public.courses
  add column if not exists kind text not null default 'video';
alter table public.courses
  add column if not exists overview jsonb;
do $$ begin
  alter table public.courses
    add constraint courses_kind_check check (kind in ('video', 'interactive'));
exception when duplicate_object then null; end $$;

-- Rich module body for interactive courses:
-- { objective, lessons:[{title,time,blocks:[...]}], activity, quiz:[{q,choices,correct,feedback}] }
alter table public.course_modules
  add column if not exists content jsonb;

-- One row per (member, module) once the member marks it complete. Feeds the
-- sticky progress bar. course_id is denormalised so the bar is one indexed read.
create table if not exists public.course_module_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
create index if not exists idx_course_module_progress_user_course
  on public.course_module_progress (user_id, course_id);

alter table public.course_module_progress enable row level security;

-- A member sees and edits ONLY their own progress.
do $$ begin
  create policy "own progress read" on public.course_module_progress
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own progress insert" on public.course_module_progress
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own progress delete" on public.course_module_progress
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
