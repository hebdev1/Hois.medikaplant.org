-- Personal per-lesson notes a student writes while learning. One row per
-- (user, module); autosaved from the course player.
create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create index if not exists idx_lesson_notes_user on public.lesson_notes(user_id);

alter table public.lesson_notes enable row level security;

drop policy if exists "lesson_notes_select_own" on public.lesson_notes;
create policy "lesson_notes_select_own" on public.lesson_notes
  for select using (user_id = auth.uid());
drop policy if exists "lesson_notes_insert_own" on public.lesson_notes;
create policy "lesson_notes_insert_own" on public.lesson_notes
  for insert with check (user_id = auth.uid());
drop policy if exists "lesson_notes_update_own" on public.lesson_notes;
create policy "lesson_notes_update_own" on public.lesson_notes
  for update using (user_id = auth.uid());
drop policy if exists "lesson_notes_delete_own" on public.lesson_notes;
create policy "lesson_notes_delete_own" on public.lesson_notes
  for delete using (user_id = auth.uid());
