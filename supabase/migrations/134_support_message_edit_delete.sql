-- 134_support_message_edit_delete
-- Let each side edit + (soft-)delete its own support messages.
--   member  -> own 'user' messages (in their own thread)
--   admin   -> 'agent' / 'system' messages
-- Edits stamp edited_at; deletes stamp deleted_at and blank the content.

alter table public.support_messages add column if not exists edited_at timestamptz;
alter table public.support_messages add column if not exists deleted_at timestamptz;

-- Allow an empty body once a message is soft-deleted.
alter table public.support_messages drop constraint if exists support_messages_body_check;
alter table public.support_messages add constraint support_messages_body_check
  check (
    char_length(body) <= 4000
    and (char_length(body) >= 1 or image_url is not null or deleted_at is not null)
  );

-- ── edit ─────────────────────────────────────────────────────────────────────
create or replace function public.edit_support_message(
  p_message_id uuid,
  p_body text
)
returns support_messages
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_msg public.support_messages;
  v_thread public.support_threads;
  v_is_admin boolean;
  v_body text := coalesce(trim(p_body), '');
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if v_body = '' then raise exception 'Body is empty'; end if;
  if char_length(v_body) > 4000 then raise exception 'Body too long'; end if;

  select * into v_msg from public.support_messages where id = p_message_id;
  if not found then raise exception 'Message not found'; end if;
  if v_msg.deleted_at is not null then raise exception 'Message deleted'; end if;

  select * into v_thread from public.support_threads where id = v_msg.thread_id;
  select (role = 'admin') into v_is_admin from public.profiles where id = v_uid;

  if v_msg.sender_role = 'user' then
    if v_thread.user_id <> v_uid then raise exception 'Not allowed'; end if;
  elsif v_msg.sender_role in ('agent', 'system') then
    if not coalesce(v_is_admin, false) then raise exception 'Not allowed'; end if;
  else
    raise exception 'Not allowed';
  end if;

  update public.support_messages
     set body = v_body, edited_at = now()
   where id = p_message_id
   returning * into v_msg;
  return v_msg;
end;
$function$;

grant execute on function public.edit_support_message(uuid, text) to authenticated;

-- ── delete (soft) ─────────────────────────────────────────────────────────────
create or replace function public.delete_support_message(
  p_message_id uuid
)
returns support_messages
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_msg public.support_messages;
  v_thread public.support_threads;
  v_is_admin boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select * into v_msg from public.support_messages where id = p_message_id;
  if not found then raise exception 'Message not found'; end if;

  select * into v_thread from public.support_threads where id = v_msg.thread_id;
  select (role = 'admin') into v_is_admin from public.profiles where id = v_uid;

  if v_msg.sender_role = 'user' then
    if v_thread.user_id <> v_uid then raise exception 'Not allowed'; end if;
  elsif v_msg.sender_role in ('agent', 'system') then
    if not coalesce(v_is_admin, false) then raise exception 'Not allowed'; end if;
  else
    raise exception 'Not allowed';
  end if;

  update public.support_messages
     set deleted_at = now(), body = '', image_url = null
   where id = p_message_id
   returning * into v_msg;
  return v_msg;
end;
$function$;

grant execute on function public.delete_support_message(uuid) to authenticated;
