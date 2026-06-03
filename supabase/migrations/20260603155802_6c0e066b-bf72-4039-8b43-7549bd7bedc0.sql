-- Rename enum value
ALTER TYPE public.app_role RENAME VALUE 'member' TO 'customer';

-- Recreate handle_new_user with updated role literal
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
         ELSE 'customer'::app_role END
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