-- Every new signup used to receive a fake "active basic $350" subscription,
-- which (a) showed a wrong $350 everywhere and (b) handed everyone free access
-- so nobody actually paid. New behaviour: handle_new_user still creates the
-- profile, but NO default subscription — so a new member must buy a real plan
-- (Stripe, at the real Bazilik price) to get access. Existing signup_default
-- rows are kept (not deleted); their amount is corrected separately.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_first text := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
  v_last  text := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '');
  v_full  text := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  v_name  text;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', v_first, v_last)), ''),
    v_full,
    split_part(NEW.email, '@', 1)
  );

  -- Insert profile (defensive — never block auth signup).
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
    VALUES (NEW.id, NEW.email, v_name, v_first, v_last)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for % (%): %',
      NEW.id, NEW.email, SQLERRM;
  END;

  -- No default subscription: access now requires a real paid (Stripe) plan.
  RETURN NEW;
END;
$function$;
