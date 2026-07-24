-- Track when the member last opened their conversation, so the floating
-- message box can show an unread badge for admin messages they have not seen.
--
-- Unread = an 'agent' message whose created_at is newer than this marker
-- (or all agent messages when the marker is null). The existing "Users update
-- their own threads" RLS policy already lets the member stamp this.

alter table public.support_threads
  add column if not exists member_last_read_at timestamptz;
