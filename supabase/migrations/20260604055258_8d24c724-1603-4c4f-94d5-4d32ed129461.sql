DROP POLICY IF EXISTS st_admin_write ON public.service_types;

CREATE POLICY st_staff_write ON public.service_types
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));