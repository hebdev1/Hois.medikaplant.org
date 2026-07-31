-- Add "interactive" to the course delivery-format options so a course can be
-- marked as an interactive course (leson + quiz) straight from the admin form's
-- "Fòma livrezon" field. `kind` is derived from `format` on save, and the member
-- dashboard uses format = 'interactive' to badge these courses and route them to
-- the interactive renderer at /klas/[slug].
alter table public.courses drop constraint courses_format_check;
alter table public.courses add constraint courses_format_check
  check (format = any (array['video'::text, 'live_zoom'::text, 'hybrid'::text, 'interactive'::text]));

-- Bring existing interactive courses onto the new single control (format now
-- carries the interactive flag).
update public.courses set format = 'interactive' where kind = 'interactive';
