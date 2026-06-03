
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_read_own_or_admin" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "notif_insert_staff_admin" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "notif_update_own_or_admin" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "notif_delete_own_or_admin" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Auto-notify admins when a new customer profile is created
CREATE OR REPLACE FUNCTION public.fn_notify_admins_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE user_id = NEW.user_id;
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_admin.user_id,
      'customer_created',
      'New customer registered',
      COALESCE(v_name, 'A new customer') || ' has joined.',
      '/dashboard/admin/crm/' || NEW.id::text,
      jsonb_build_object('customer_id', NEW.id, 'user_id', NEW.user_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_new_customer
  AFTER INSERT ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_admins_new_customer();

-- Auto-notify admins on new appointment
CREATE OR REPLACE FUNCTION public.fn_notify_admins_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE user_id = NEW.user_id;
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      v_admin.user_id,
      'appointment_created',
      'New appointment scheduled',
      COALESCE(v_name, 'A customer') || ' booked for ' || NEW.scheduled_date::text || ' at ' || NEW.scheduled_start_time::text,
      '/dashboard/admin/manage',
      jsonb_build_object('appointment_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_admins_new_appointment();
