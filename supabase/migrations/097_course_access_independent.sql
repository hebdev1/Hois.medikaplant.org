-- Courses are now independent of subscriptions: access comes from enrolment
-- (a purchase for a paid course, a free click for a free one), never from the
-- member's plan tier. Drop the plan gate that previously restricted
-- free-with-subscription courses to a matching plan.
CREATE OR REPLACE FUNCTION public.enroll_in_course(p_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cap     int;
  v_taken   int;
  v_active  boolean;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select seat_capacity, active
    into v_cap, v_active
  from public.courses
  where id = p_course_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'course_not_found');
  end if;
  if not v_active then
    return jsonb_build_object('ok', false, 'error', 'course_inactive');
  end if;

  -- No plan gate: paid courses gate on payment (checkout); free courses are
  -- open to any signed-in user regardless of subscription.

  if v_cap is not null then
    select count(*) into v_taken
    from public.course_enrollments
    where course_id = p_course_id;
    if v_taken >= v_cap then
      return jsonb_build_object('ok', false, 'error', 'course_full',
                                'capacity', v_cap);
    end if;
  end if;

  insert into public.course_enrollments(course_id, user_id, source)
  values (p_course_id, v_user_id, 'click')
  on conflict (course_id, user_id) do nothing;

  return jsonb_build_object('ok', true);
end$function$;
