-- 133_support_presence_and_attachments
-- (A) support_settings singleton: availability mode + weekly hours + global
--     support identity (name/role/photo) that drives the client chat badge.
-- (B) support_messages.image_url + relaxed body check (image-only messages).
-- (C) admin_send_support_reply gains an optional image param.

-- ── (A) support_settings ────────────────────────────────────────────────────
create table if not exists public.support_settings (
  id                int primary key default 1,
  availability_mode text not null default 'auto'
                      check (availability_mode in ('auto','online','offline')),
  -- 7 entries, index 0=Sunday .. 6=Saturday (matches JS Date.getDay()).
  hours             jsonb not null default
    '[{"enabled":false,"start":"09:00","end":"17:00"},
      {"enabled":true,"start":"09:00","end":"17:00"},
      {"enabled":true,"start":"09:00","end":"17:00"},
      {"enabled":true,"start":"09:00","end":"17:00"},
      {"enabled":true,"start":"09:00","end":"17:00"},
      {"enabled":true,"start":"09:00","end":"17:00"},
      {"enabled":true,"start":"09:00","end":"13:00"}]'::jsonb,
  timezone          text not null default 'America/Port-au-Prince',
  offline_message   text not null default 'Nou pa disponib kounye a. Kite mesaj ou — n ap reponn ou pi bonè.',
  agent_name        text,
  agent_role        text,
  agent_photo_url   text,
  updated_by        uuid references auth.users(id) on delete set null,
  updated_at        timestamptz not null default now(),
  constraint support_settings_singleton check (id = 1)
);

insert into public.support_settings (id) values (1) on conflict (id) do nothing;

alter table public.support_settings enable row level security;

drop policy if exists support_settings_admin_all on public.support_settings;
create policy support_settings_admin_all on public.support_settings
  for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists support_settings_read on public.support_settings;
create policy support_settings_read on public.support_settings
  for select to anon, authenticated using (true);

grant select on public.support_settings to anon, authenticated;

-- ── (B) image attachments ────────────────────────────────────────────────────
alter table public.support_messages add column if not exists image_url text;

alter table public.support_messages drop constraint if exists support_messages_body_check;
alter table public.support_messages add constraint support_messages_body_check
  check (char_length(body) <= 4000 and (char_length(body) >= 1 or image_url is not null));

-- ── (C) admin reply RPC with optional image ──────────────────────────────────
drop function if exists public.admin_send_support_reply(uuid, text);

create or replace function public.admin_send_support_reply(
  p_thread_id uuid,
  p_body text,
  p_image_url text default null
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

  if v_body = '' and v_image is null then
    raise exception 'Body is empty';
  end if;

  insert into public.support_messages (thread_id, sender_role, sender_id, body, image_url)
  values (p_thread_id, 'agent', v_admin_id, v_body, v_image)
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

grant execute on function public.admin_send_support_reply(uuid, text, text) to authenticated;
