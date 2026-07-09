-- Migration 081: pin search_path on the two trigger helper functions the
-- security advisor flagged (function_search_path_mutable). A mutable
-- search_path on a function lets a caller's session search_path change
-- which schema an unqualified name resolves to — a classic injection
-- surface. These are simple BEFORE-UPDATE touch triggers; pinning them to
-- `public` closes the warning with zero behavior change.

create or replace function public._touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end$$;

create or replace function public._touch_suggestion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status and old.status = 'new' then
    new.triaged_at := coalesce(new.triaged_at, now());
  end if;
  return new;
end$$;
