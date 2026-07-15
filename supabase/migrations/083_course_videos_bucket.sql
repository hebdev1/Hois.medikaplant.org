-- Migration 083: private `course-videos` Storage bucket (course-delivery
-- Phase 1). Holds self-hosted recorded-course video files.
--
-- No storage.objects RLS policies are defined on purpose: ALL access is
-- brokered server-side with the service role —
--   • admin upload  → createSignedUploadUrl (after an is-admin check)
--   • student watch → createSignedUrl        (after an enrollment check)
-- Both mint self-authenticating, time-limited URLs, so the bucket stays
-- fully private (no anon/authenticated direct read).
--
-- file_size_limit is a per-bucket cap; the PROJECT-level global upload limit
-- (Dashboard → Storage → Settings) still applies and may need raising for
-- large videos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-videos',
  'course-videos',
  false,
  1073741824, -- 1 GiB per file
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
