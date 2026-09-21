-- 135_support_file_attachments
-- Generalize chat attachments beyond images: PDFs, Office docs, text, zip.
-- Images keep rendering inline via image_url; other files use file_url +
-- file_name (a downloadable chip).

-- (A) Widen the shared public bucket to accept documents (+ gif) as well as
--     the existing image types. Executables / HTML are deliberately excluded.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/svg+xml','image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain','text/csv','application/zip'
]
where id = 'public-assets';

-- (B) Columns for non-image file attachments.
alter table public.support_messages add column if not exists file_url text;
alter table public.support_messages add column if not exists file_name text;

alter table public.support_messages drop constraint if exists support_messages_body_check;
alter table public.support_messages add constraint support_messages_body_check
  check (
    char_length(body) <= 4000
    and (
      char_length(body) >= 1
      or image_url is not null
      or file_url is not null
      or deleted_at is not null
    )
  );

-- (C) admin reply RPC now carries an optional file too.
drop function if exists public.admin_send_support_reply(uuid, text, text);

create or replace function public.admin_send_support_reply(
  p_thread_id uuid,
  p_body text,
  p_image_url text default null,
  p_file_url text default null,
  p_file_name text default null
)
returns support_messages
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_role text;
  v_admin_id uuid;
  v_msg public.support_messages;
  v_full_name text;
  v_persona text;
  v_initials text;
  v_admin_label text;
  v_body text := coalesce(trim(p_body), '');
  v_image text := nullif(trim(coalesce(p_image_url, '')), '');
  v_file text := nullif(trim(coalesce(p_file_url, '')), '');
  v_file_name text := nullif(trim(coalesce(p_file_name, '')), '');
begin
  v_admin_id := auth.uid();
  if v_admin_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.role,
         coalesce(p.full_name, split_part(p.email, '@', 1)),
         p.support_persona_name
    into v_role, v_full_name, v_persona
  from public.profiles p
  where p.id = v_admin_id;

  if v_role is distinct from 'admin' then
    raise exception 'Admin access required';
  end if;

  if v_body = '' and v_image is null and v_file is null then
    raise exception 'Body is empty';
  end if;

  insert into public.support_messages
    (thread_id, sender_role, sender_id, body, image_url, file_url, file_name)
  values
    (p_thread_id, 'agent', v_admin_id, v_body, v_image, v_file, v_file_name)
  returning * into v_msg;

  v_admin_label := coalesce(nullif(trim(v_persona), ''), v_full_name);
  v_initials := upper(substring(v_admin_label from 1 for 1));

  update public.support_threads
  set status         = 'open',
      agent_name     = v_admin_label,
      agent_role     = 'Administratè Hoïs',
      agent_initials = v_initials,
      updated_at     = now()
  where id = p_thread_id;

  return v_msg;
end;
$function$;

grant execute on function public.admin_send_support_reply(uuid, text, text, text, text) to authenticated;

-- (D) Deleting a message also clears any file attachment.
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
     set deleted_at = now(), body = '', image_url = null, file_url = null, file_name = null
   where id = p_message_id
   returning * into v_msg;
  return v_msg;
end;
$function$;

grant execute on function public.delete_support_message(uuid) to authenticated;
