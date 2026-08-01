-- Course ratings & reviews. One review per student per course. Reviews are
-- public (shown on the course sales page), so the author's display name is
-- denormalized in so we never need to read profiles publicly.
create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index if not exists idx_course_reviews_course on public.course_reviews(course_id);

alter table public.course_reviews enable row level security;

drop policy if exists "course_reviews_select_all" on public.course_reviews;
create policy "course_reviews_select_all" on public.course_reviews
  for select using (true);
drop policy if exists "course_reviews_insert_own" on public.course_reviews;
create policy "course_reviews_insert_own" on public.course_reviews
  for insert with check (user_id = auth.uid());
drop policy if exists "course_reviews_update_own" on public.course_reviews;
create policy "course_reviews_update_own" on public.course_reviews
  for update using (user_id = auth.uid());
drop policy if exists "course_reviews_delete_own" on public.course_reviews;
create policy "course_reviews_delete_own" on public.course_reviews
  for delete using (user_id = auth.uid());
