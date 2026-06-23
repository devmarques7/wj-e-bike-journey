DROP POLICY IF EXISTS ss_admin_write ON public.staff_schedules;
CREATE POLICY ss_admin_or_staff_write ON public.staff_schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));