CREATE OR REPLACE FUNCTION public.fn_create_plan_version(
  p_plan_id uuid,
  p_price numeric,
  p_currency text DEFAULT 'EUR',
  p_interval plan_interval_enum DEFAULT 'monthly',
  p_trial_days integer DEFAULT 0,
  p_features jsonb DEFAULT '[]'::jsonb,
  p_activate boolean DEFAULT true,
  p_urgent_service_included boolean DEFAULT true,
  p_urgent_service_fee numeric DEFAULT 0
) RETURNS plan_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_next int;
  v_row public.plan_versions;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(MAX(version_number),0)+1 INTO v_next
  FROM public.plan_versions WHERE plan_id = p_plan_id;

  IF p_activate THEN
    UPDATE public.plan_versions SET status='archived'
    WHERE plan_id = p_plan_id AND status='active';
  END IF;

  INSERT INTO public.plan_versions
    (plan_id, version_number, price, currency, interval, trial_days, features, status,
     urgent_service_included, urgent_service_fee)
  VALUES
    (p_plan_id, v_next, p_price, p_currency, p_interval, p_trial_days, p_features,
     CASE WHEN p_activate THEN 'active'::plan_version_status_enum ELSE 'draft'::plan_version_status_enum END,
     p_urgent_service_included, p_urgent_service_fee)
  RETURNING * INTO v_row;

  RETURN v_row;
END $function$;