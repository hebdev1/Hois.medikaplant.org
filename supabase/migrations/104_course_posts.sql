-- Per-course discussion. Only students enrolled in the same course can read and
-- post (enforced in RLS via a course_enrollments existence check).
create table if not exists public.course_posts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_posts_course
  on public.course_posts(course_id, created_at desc);

alter table public.course_posts enable row level security;

drop policy if exists "course_posts_select_enrolled" on public.course_posts;
create policy "course_posts_select_enrolled" on public.course_posts
  for select using (
    exists (
      select 1 from public.course_enrollments e
      where e.course_id = course_posts.course_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "course_posts_insert_enrolled" on public.course_posts;
create policy "course_posts_insert_enrolled" on public.course_posts
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_enrollments e
      where e.course_id = course_posts.course_id and e.user_id = auth.uid()
    )
  );
