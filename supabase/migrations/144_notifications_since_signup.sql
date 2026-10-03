-- Notifications visible to a member are limited to those created AFTER the
-- member joined. A brand-new member should not inherit every historical
-- broadcast (target='all'/'plan') as unread. The inbox page and the bell apply
-- the same `created_at >= profiles.created_at` bound in their queries; this
-- keeps the unread-count badge consistent with them.
--
-- Personal notifications (target='user') are always created after the member
-- exists, so this bound never hides them. A missing profile falls back to
-- '-infinity' (show everything), matching the app's epoch fallback.

CREATE OR REPLACE FUNCTION public.user_unread_notifications_count(uid uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT count(*)::int FROM public.notifications n
  WHERE (
    n.target = 'all'
    OR (n.target = 'plan' AND n.target_plan = public.get_user_plan(uid))
    OR (n.target = 'user' AND n.target_user_id = uid)
  )
  AND n.created_at >= COALESCE(
    (SELECT p.created_at FROM public.profiles p WHERE p.id = uid),
    '-infinity'::timestamptz
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.notification_reads nr
    WHERE nr.notification_id = n.id AND nr.user_id = uid
  );
$function$;
