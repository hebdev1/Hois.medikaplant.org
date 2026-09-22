-- 137_revoke_anon_execute
-- Supabase grants EXECUTE to anon/authenticated explicitly, so the
-- `revoke ... from public` in 136 didn't remove anon's access. Revoke anon
-- (and, for the trigger-only helper, authenticated) directly.

-- notify_admins is only invoked by SECURITY DEFINER triggers (run as owner),
-- so it needs no role-level EXECUTE at all.
revoke execute on function public.notify_admins(text, text, text) from anon, authenticated;

-- These self-check auth.uid()/ownership; they must require a signed-in user.
revoke execute on function public.enroll_in_course(uuid) from anon;
revoke execute on function public.admin_send_support_reply(uuid, text, text, text, text) from anon;
revoke execute on function public.edit_support_message(uuid, text) from anon;
revoke execute on function public.delete_support_message(uuid) from anon;
