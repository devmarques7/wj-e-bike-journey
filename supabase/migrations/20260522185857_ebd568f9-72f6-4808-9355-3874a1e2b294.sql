
-- 1. Revoke EXECUTE on SECURITY DEFINER RPCs from anon (admins/staff still call as authenticated; functions enforce role checks internally)
REVOKE EXECUTE ON FUNCTION public.fn_create_plan_version(uuid, numeric, text, plan_interval_enum, integer, jsonb, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_register_manual_payment(uuid, numeric, payment_method_enum, timestamptz, timestamptz, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_change_subscription_plan(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_cancel_subscription(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_adjust_stock(uuid, uuid, integer, movement_type_enum, text, uuid, text) FROM anon, public;

-- 2. Hide analytics views from anon (authenticated keeps access; RLS via security_invoker still applies)
REVOKE SELECT ON public.v_plan_kpis FROM anon;
REVOKE SELECT ON public.v_subscriber_summary FROM anon;
REVOKE SELECT ON public.v_mrr_timeseries FROM anon;

-- 3. Locations: restrict to authenticated
DROP POLICY IF EXISTS locations_read_all ON public.locations;
CREATE POLICY locations_read_auth ON public.locations
  FOR SELECT TO authenticated USING (true);

-- 4. plan_versions: keep public read but hide stripe_price_id column
REVOKE SELECT (stripe_price_id) ON public.plan_versions FROM anon, authenticated;
-- service_role retains access for edge functions

-- 5. Remove broad listing SELECT on public buckets (public URLs still work via CDN)
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
