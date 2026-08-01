-- Treatment adherence: one row per day a member marks a treatment as done.
-- Powers the "Mwen pran l jodi a" toggle + the 7-day streak / adherence % on
-- the member dashboard's "Pwopozisyon Ton vye" panel.
create table if not exists public.treatment_doses (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatment_recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_on date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (treatment_id, taken_on)
);

create index if not exists idx_treatment_doses_user on public.treatment_doses(user_id);
create index if not exists idx_treatment_doses_treatment
  on public.treatment_doses(treatment_id, taken_on);

alter table public.treatment_doses enable row level security;

-- Members manage only their own dose marks.
drop policy if exists "treatment_doses_select_own" on public.treatment_doses;
create policy "treatment_doses_select_own" on public.treatment_doses
  for select using (user_id = auth.uid());

drop policy if exists "treatment_doses_insert_own" on public.treatment_doses;
create policy "treatment_doses_insert_own" on public.treatment_doses
  for insert with check (user_id = auth.uid());

drop policy if exists "treatment_doses_delete_own" on public.treatment_doses;
create policy "treatment_doses_delete_own" on public.treatment_doses
  for delete using (user_id = auth.uid());
