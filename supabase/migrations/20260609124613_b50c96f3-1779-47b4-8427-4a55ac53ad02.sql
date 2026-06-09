
-- 1) Restrict locations SELECT to admin/staff only
DROP POLICY IF EXISTS locations_read_auth ON public.locations;
CREATE POLICY locations_read_staff ON public.locations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'staff'::app_role));

-- 2) Hide stripe_product_id on plans from anon/authenticated (service_role keeps access)
REVOKE SELECT (stripe_product_id) ON public.plans FROM anon, authenticated;

-- 3) Hide stripe_price_id on plan_versions from anon/authenticated
REVOKE SELECT (stripe_price_id) ON public.plan_versions FROM anon, authenticated;
