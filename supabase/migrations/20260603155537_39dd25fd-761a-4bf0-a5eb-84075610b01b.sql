-- 1) Add is_default column
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- 2) Unique partial index: only one default plan
CREATE UNIQUE INDEX IF NOT EXISTS plans_only_one_default
  ON public.plans ((is_default)) WHERE is_default = true;

-- 3) Trigger to ensure setting a new default unsets the previous one
CREATE OR REPLACE FUNCTION public.fn_enforce_single_default_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.plans SET is_default = false
     WHERE id <> NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_plans_single_default ON public.plans;
CREATE TRIGGER trg_plans_single_default
BEFORE INSERT OR UPDATE OF is_default ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_single_default_plan();

-- 4) Update handle_new_user to subscribe new users to the default plan's active version (if any)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_version_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'admin@wjvision.com' THEN 'admin'::app_role
         ELSE 'member'::app_role END
  );

  SELECT pv.id INTO v_plan_version_id
    FROM public.plans p
    JOIN public.plan_versions pv ON pv.plan_id = p.id AND pv.status = 'active'
   WHERE p.is_default = true AND p.is_active = true
   ORDER BY pv.version_number DESC
   LIMIT 1;

  IF v_plan_version_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_version_id, status, payment_method)
    VALUES (NEW.id, v_plan_version_id, 'active', 'cash');
  END IF;

  RETURN NEW;
END;
$$;