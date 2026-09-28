-- Disaster-recovery / reproducibility fix.
--
-- The role-immutability guard function (enforce_profile_role_immutable) is
-- defined in migration 136, but the TRIGGER that invokes it on every profiles
-- UPDATE (trg_profiles_enforce_role) was created in a pre-076 migration that is
-- NOT part of this repository. A database rebuilt purely from the repo
-- migrations would therefore have the function but not the trigger, silently
-- dropping the protection that blocks non-admins from escalating their own
-- role / admin_role / plan. This re-asserts the trigger so the repo alone
-- reproduces the live security control. Idempotent; matches production exactly.

drop trigger if exists trg_profiles_enforce_role on public.profiles;

create trigger trg_profiles_enforce_role
  before update on public.profiles
  for each row
  execute function public.enforce_profile_role_immutable();
