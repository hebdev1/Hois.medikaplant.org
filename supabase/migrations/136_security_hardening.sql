-- 136_security_hardening
-- Closes paywall/plan bypasses + tightens function/exec exposure found in the
-- 2026-09-22 audit. No destructive data changes.

-- ── H2: stop members self-granting a subscription ────────────────────────────
-- Subscriptions are written only by the Stripe webhook (service role) and by
-- admins (is_admin policy). There is no legitimate member-context insert, so
-- the over-permissive user-insert policy is pure attack surface.
drop policy if exists "Users can insert their own subscriptions" on public.subscriptions;

-- ── H2: a member may not change their OWN plan directly ──────────────────────
create or replace function public.enforce_profile_role_immutable()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Admins can change roles/plan (needed for /admin/users management).
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'You may not change your own role.' using errcode = '42501';
  end if;
  if new.admin_role is distinct from old.admin_role then
    raise exception 'You may not change your own admin_role.' using errcode = '42501';
  end if;
  -- Backend/service writes have a null auth.uid() and are allowed (webhook,
  -- subscription->plan sync). A signed-in member may not self-upgrade.
  if auth.uid() is not null and new.plan is distinct from old.plan then
    raise exception 'You may not change your own plan.' using errcode = '42501';
  end if;

  return new;
end;
$function$;

-- ── H3: enroll_in_course must not grant paid/above-plan courses for free ─────
create or replace function public.enroll_in_course(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_cap int;
  v_taken int;
  v_active boolean;
  v_price int;
  v_plan_required text;
  v_plan text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select seat_capacity, active, price_cents, plan_required
    into v_cap, v_active, v_price, v_plan_required
  from public.courses
  where id = p_course_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'course_not_found');
  end if;
  if not v_active then
    return jsonb_build_object('ok', false, 'error', 'course_inactive');
  end if;

  if v_price is not null and v_price > 0 then
    -- Paid course: a click-enroll must never grant access. Paid enrollments are
    -- created only by the Stripe webhook (source='purchase') after payment.
    if not exists (
      select 1 from public.course_purchases
      where course_id = p_course_id and user_id = v_user_id and status = 'paid'
    ) then
      return jsonb_build_object('ok', false, 'error', 'payment_required');
    end if;
  else
    -- Free / subscription course: the member's plan must cover plan_required.
    v_plan := coalesce(public.get_user_plan(v_user_id)::text, 'basic');
    if (case v_plan when 'vip' then 3 when 'premium' then 2 when 'basic' then 1 else 0 end)
       < (case coalesce(v_plan_required,'basic') when 'vip' then 3 when 'premium' then 2 when 'basic' then 1 else 0 end)
    then
      return jsonb_build_object('ok', false, 'error', 'plan_required');
    end if;
  end if;

  if v_cap is not null then
    select count(*) into v_taken
    from public.course_enrollments
    where course_id = p_course_id;
    if v_taken >= v_cap then
      return jsonb_build_object('ok', false, 'error', 'course_full', 'capacity', v_cap);
    end if;
  end if;

  insert into public.course_enrollments(course_id, user_id, source)
  values (p_course_id, v_user_id, 'click')
  on conflict (course_id, user_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$function$;

grant execute on function public.enroll_in_course(uuid) to authenticated;
revoke execute on function public.enroll_in_course(uuid) from public;

-- ── H3: drop the orphaned, client-trusting purchase RPC ──────────────────────
drop function if exists public.purchase_course(uuid, integer, text);

-- ── M1: notify_admins() must not be callable from the API ────────────────────
revoke execute on function public.notify_admins(text, text, text) from public;

-- ── M3: support RPCs authenticated-only (they self-check; drop anon reach) ────
revoke execute on function public.admin_send_support_reply(uuid, text, text, text, text) from public;
grant execute on function public.admin_send_support_reply(uuid, text, text, text, text) to authenticated;
revoke execute on function public.edit_support_message(uuid, text) from public;
grant execute on function public.edit_support_message(uuid, text) to authenticated;
revoke execute on function public.delete_support_message(uuid) from public;
grant execute on function public.delete_support_message(uuid) to authenticated;

-- ── H5 (interim): drop SVG (stored-XSS vector) from the shared public bucket ─
update storage.buckets
set allowed_mime_types = array_remove(allowed_mime_types, 'image/svg+xml')
where id = 'public-assets';
