-- 141: VIP Profile / VIP Wall cross-member reads (Melis-only).
--
-- Profiles are private under RLS, so the member-facing VIP Wall (roster of
-- opted-in Melis members) and the "view another member's profile" showcase go
-- through SECURITY DEFINER RPCs gated to Melis callers — the same pattern as the
-- marketplace_* reads, and keeping RLS on `profiles` closed. A member's OWN full
-- profile does NOT use these (it reads own data directly under RLS).
--
-- Consent model: only members who opted into `vip_members` (the "parèt nan sèk
-- Melis" toggle) appear on the Wall / are viewable by others. Showcase is a
-- non-sensitive subset — identity + level + aggregate counts — never health data.

-- Roster for the Wall: opted-in, currently-Melis members. Caller must be Melis.
create or replace function public.vip_roster()
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  joined_at timestamptz,
  level integer,
  level_name text
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if coalesce((select p.plan::text from public.profiles p where p.id = auth.uid()), '') <> 'vip' then
    return; -- non-Melis callers get an empty roster
  end if;
  return query
    select
      v.user_id,
      coalesce(nullif(btrim(pr.full_name), ''), split_part(pr.email, '@', 1)) as display_name,
      pr.avatar_url,
      pr.bio,
      v.joined_at,
      public.user_level(v.user_id) as level,
      public.user_level_name(v.user_id) as level_name
    from public.vip_members v
    join public.profiles pr on pr.id = v.user_id
    where pr.plan = 'vip'
    order by v.joined_at desc nulls last;
end;
$$;

-- One member's showcase subset. Allowed when the caller views their OWN profile,
-- or when the caller is Melis AND the target opted into the circle. Returns the
-- non-sensitive summary only (no protocol/health data).
create or replace function public.vip_member_showcase(target uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  country text,
  created_at timestamptz,
  plan text,
  level integer,
  level_name text,
  streak integer,
  badges_unlocked integer,
  courses_completed integer,
  contributions integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
  caller_is_melis boolean := coalesce((select p.plan::text from public.profiles p where p.id = auth.uid()), '') = 'vip';
  target_opted_in boolean := exists (select 1 from public.vip_members v where v.user_id = target);
begin
  if caller is null then return; end if;
  if target <> caller and (not caller_is_melis or not target_opted_in) then
    return; -- not allowed to view this member
  end if;

  return query
    select
      pr.id,
      coalesce(nullif(btrim(pr.full_name), ''), split_part(pr.email, '@', 1)),
      pr.avatar_url,
      pr.bio,
      pr.city,
      pr.country,
      pr.created_at,
      pr.plan::text,
      public.user_level(target),
      public.user_level_name(target),
      public.user_streak(target),
      (select count(*)::int from public.user_badges ub where ub.user_id = target and ub.unlocked),
      (select count(*)::int from (
         select cmp.course_id
         from public.course_module_progress cmp
         where cmp.user_id = target
         group by cmp.course_id
         having count(*) >= (select count(*) from public.course_modules cm where cm.course_id = cmp.course_id)
       ) done_courses),
      (
        (select count(*) from public.forum_topics ft where ft.user_id = target)
      + (select count(*) from public.forum_replies fr where fr.user_id = target)
      + (select count(*) from public.user_suggestions us where us.user_id = target)
      )::int
    from public.profiles pr
    where pr.id = target;
end;
$$;

revoke all on function public.vip_roster() from anon, public;
revoke all on function public.vip_member_showcase(uuid) from anon, public;
grant execute on function public.vip_roster() to authenticated;
grant execute on function public.vip_member_showcase(uuid) to authenticated;
