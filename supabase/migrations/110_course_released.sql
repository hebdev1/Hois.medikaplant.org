-- Pre-order support. A course that is `active` (published/buyable) but
-- `released = false` is in pre-order mode: it can be bought in advance, but its
-- content stays locked ("coming soon") until an admin flips released → true,
-- which notifies everyone who pre-ordered. Existing courses default to released.
alter table public.courses
  add column if not exists released boolean not null default true;
