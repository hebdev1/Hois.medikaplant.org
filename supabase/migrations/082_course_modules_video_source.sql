-- Migration 082: course_modules video source (external URL vs self-hosted).
-- Phase 1 of course-delivery (see docs/superpowers/specs/2026-07-15-course-
-- delivery-design.md). A recorded module can either point at an external
-- video URL (YouTube/Vimeo) or a private file uploaded to the `course-videos`
-- Storage bucket. Existing rows default to 'external' — they already carry
-- video_url — so this is backward compatible.

alter table public.course_modules
  add column if not exists video_source text not null default 'external'
    check (video_source in ('external', 'storage'));

alter table public.course_modules
  add column if not exists video_path text;

comment on column public.course_modules.video_source is
  'external = play video_url; storage = play a signed URL for video_path in the private course-videos bucket';
comment on column public.course_modules.video_path is
  'Object key in the private course-videos Storage bucket (used when video_source = storage)';
