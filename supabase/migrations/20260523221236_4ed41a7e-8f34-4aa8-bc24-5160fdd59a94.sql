
-- ============================================================
-- WORKSHOP SCHEDULING SYSTEM
-- ============================================================

-- 1. BUSINESS HOURS
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open boolean NOT NULL DEFAULT true,
  open_time time,
  close_time time,
  max_parallel_services int NOT NULL DEFAULT 3,
  buffer_minutes int NOT NULL DEFAULT 15,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_of_week, valid_from)
);

-- 2. BUSINESS HOUR EXCEPTIONS
CREATE TABLE public.business_hour_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_date date NOT NULL UNIQUE,
  exception_type text NOT NULL CHECK (exception_type IN ('closed','reduced_hours','extended_hours','special_event')),
  is_open boolean NOT NULL DEFAULT false,
  open_time time,
  close_time time,
  max_parallel_services int,
  reason text NOT NULL,
  is_public_holiday boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. STAFF SCHEDULES (staff_id refers to profiles.user_id of users with 'staff' role)
CREATE TABLE public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_working boolean NOT NULL DEFAULT true,
  start_time time,
  end_time time,
  max_concurrent int NOT NULL DEFAULT 1,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, day_of_week, valid_from)
);

-- 4. STAFF SCHEDULE EXCEPTIONS
CREATE TABLE public.staff_schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  exception_date date NOT NULL,
  exception_type text NOT NULL CHECK (exception_type IN ('day_off','vacation','sick_leave','training','reduced_hours','extra_hours')),
  is_working boolean NOT NULL DEFAULT false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, exception_date)
);

-- 5. SERVICE TYPES
CREATE TABLE public.service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_nl text,
  name_en text,
  slug text NOT NULL UNIQUE,
  description text,
  duration_minutes int NOT NULL,
  buffer_minutes_override int,
  required_specializations text[],
  covered_by_plan_levels int[],
  base_price numeric(10,2),
  is_emergency boolean NOT NULL DEFAULT false,
  priority_score int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. APPOINTMENTS (created from scratch — no existing table)
CREATE TYPE public.appointment_status_enum AS ENUM (
  'pending','confirmed','in_progress','completed','canceled','no_show','rescheduled'
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_type_id uuid REFERENCES public.service_types(id),
  assigned_mechanic_id uuid,
  subscription_id uuid REFERENCES public.subscriptions(id),
  subscription_plan_level int,
  is_covered_by_plan boolean NOT NULL DEFAULT false,
  extra_charge_eur numeric(10,2) DEFAULT 0,
  scheduled_date date NOT NULL,
  scheduled_start_time time NOT NULL,
  scheduled_end_time time,
  duration_minutes int,
  status appointment_status_enum NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','vip','emergency')),
  priority_score int NOT NULL DEFAULT 0,
  reschedule_of uuid REFERENCES public.appointments(id),
  reschedule_count int NOT NULL DEFAULT 0,
  work_started_at timestamptz,
  work_ended_at timestamptz,
  actual_duration_minutes int,
  confirmation_sent_at timestamptz,
  reminder_24h_sent_at timestamptz,
  booked_via text NOT NULL DEFAULT 'portal' CHECK (booked_via IN ('portal','admin','phone','walk_in')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_no_user_double_booking
  ON public.appointments (user_id, scheduled_date)
  WHERE status IN ('pending','confirmed','in_progress');

CREATE UNIQUE INDEX idx_no_mechanic_overlap
  ON public.appointments (assigned_mechanic_id, scheduled_date, scheduled_start_time)
  WHERE status IN ('confirmed','in_progress') AND assigned_mechanic_id IS NOT NULL;

CREATE INDEX idx_appointments_date_status ON public.appointments (scheduled_date, status);
CREATE INDEX idx_appointments_mechanic_date ON public.appointments (assigned_mechanic_id, scheduled_date);
CREATE INDEX idx_appointments_priority ON public.appointments (scheduled_date, priority_score DESC)
  WHERE status IN ('confirmed','pending');

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. VIP SLOT RULES (plan_level refers to plans.tier_level)
CREATE TABLE public.vip_slot_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_level int NOT NULL,
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),
  time_from time,
  time_until time,
  reserved_slots int NOT NULL DEFAULT 1,
  release_hours_before int NOT NULL DEFAULT 24,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. APPOINTMENT WAITLIST
CREATE TABLE public.appointment_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_type_id uuid NOT NULL REFERENCES public.service_types(id),
  subscription_id uuid REFERENCES public.subscriptions(id),
  preferred_date_from date NOT NULL,
  preferred_date_until date,
  preferred_days int[],
  preferred_time_from time,
  preferred_time_until time,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','booked','expired','canceled')),
  priority_score int NOT NULL DEFAULT 0,
  notified_at timestamptz,
  booked_appointment_id uuid REFERENCES public.appointments(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_status_priority
  ON public.appointment_waitlist (status, priority_score DESC, created_at ASC)
  WHERE status = 'waiting';

-- 9. APPOINTMENT NOTIFICATIONS
CREATE TABLE public.appointment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  waitlist_id uuid REFERENCES public.appointment_waitlist(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'booking_confirmation','reminder_24h','reminder_2h','cancellation_by_customer',
    'cancellation_by_shop','rescheduled','work_started','work_completed',
    'feedback_request','slot_available','no_show_warning'
  )),
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','push','sms')),
  recipient_email text,
  recipient_phone text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  template_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_appointment ON public.appointment_notifications (appointment_id);

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hour_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_slot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Business hours: public read, admin write
CREATE POLICY bh_read_all ON public.business_hours FOR SELECT USING (true);
CREATE POLICY bh_admin_write ON public.business_hours FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY bhe_read_all ON public.business_hour_exceptions FOR SELECT USING (true);
CREATE POLICY bhe_admin_write ON public.business_hour_exceptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff schedules: staff and admin can read all, admin manages
CREATE POLICY ss_read ON public.staff_schedules FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR staff_id = auth.uid());
CREATE POLICY ss_admin_write ON public.staff_schedules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY sse_read ON public.staff_schedule_exceptions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR staff_id = auth.uid());
CREATE POLICY sse_admin_write ON public.staff_schedule_exceptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'staff'::app_role) AND staff_id = auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'staff'::app_role) AND staff_id = auth.uid()));

-- Service types: public read, admin write
CREATE POLICY st_read_all ON public.service_types FOR SELECT USING (true);
CREATE POLICY st_admin_write ON public.service_types FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Appointments
CREATE POLICY appt_read_own_or_staff ON public.appointments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_mechanic_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY appt_member_create ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY appt_staff_update ON public.appointments FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR (user_id = auth.uid() AND status IN ('pending','confirmed'))
  );
CREATE POLICY appt_admin_delete ON public.appointments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- VIP slot rules: public read, admin write
CREATE POLICY vip_read_all ON public.vip_slot_rules FOR SELECT USING (true);
CREATE POLICY vip_admin_write ON public.vip_slot_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Waitlist
CREATE POLICY wl_read_own_or_staff ON public.appointment_waitlist FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY wl_insert ON public.appointment_waitlist FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY wl_update ON public.appointment_waitlist FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY wl_admin_delete ON public.appointment_waitlist FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Notifications: staff/admin only
CREATE POLICY notif_read ON public.appointment_notifications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY notif_write ON public.appointment_notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.business_hours (day_of_week, is_open, open_time, close_time, max_parallel_services, buffer_minutes) VALUES
  (0, false, NULL, NULL, 3, 15),
  (1, true, '09:00', '18:00', 3, 15),
  (2, true, '09:00', '18:00', 3, 15),
  (3, true, '09:00', '18:00', 3, 15),
  (4, true, '09:00', '21:00', 3, 15),
  (5, true, '09:00', '18:00', 3, 15),
  (6, true, '10:00', '16:00', 2, 15);

INSERT INTO public.business_hour_exceptions (exception_date, exception_type, is_open, reason, is_public_holiday) VALUES
  ('2025-12-25', 'closed', false, 'Eerste Kerstdag', true),
  ('2025-12-26', 'closed', false, 'Tweede Kerstdag', true),
  ('2026-01-01', 'closed', false, 'Nieuwjaarsdag', true),
  ('2026-04-27', 'closed', false, 'Koningsdag', true),
  ('2026-05-05', 'closed', false, 'Bevrijdingsdag', true),
  ('2026-12-25', 'closed', false, 'Eerste Kerstdag', true),
  ('2026-12-26', 'closed', false, 'Tweede Kerstdag', true);

INSERT INTO public.service_types (name, name_nl, name_en, slug, duration_minutes, covered_by_plan_levels, base_price, priority_score, icon, color) VALUES
  ('Revisão Básica', 'Basisonderhoud', 'Basic Service', 'basic-service', 60, ARRAY[1,2,3], 49.99, 10, 'wrench', '#058c42'),
  ('Revisão Completa', 'Volledig Onderhoud', 'Full Service', 'full-service', 120, ARRAY[2,3], 89.99, 20, 'settings', '#0ea5e9'),
  ('Reparação', 'Reparatie', 'Repair', 'repair', 90, ARRAY[2,3], NULL, 30, 'wrench', '#f59e0b'),
  ('Inspecção', 'Inspectie', 'Inspection', 'inspection', 45, ARRAY[1,2,3], 29.99, 5, 'search', '#6366f1'),
  ('Urgência', 'Spoedservice', 'Emergency', 'emergency', 60, ARRAY[3], 129.99, 100, 'alert-triangle', '#ef4444'),
  ('Diagnóstico Motor', 'Motordiagnose', 'Motor Diagnosis', 'motor-diagnosis', 75, ARRAY[3], 79.99, 40, 'cpu', '#8b5cf6'),
  ('Substituição Bateria', 'Batterij Vervanging', 'Battery Replacement', 'battery-replace', 45, NULL, NULL, 50, 'battery-charging', '#22c55e'),
  ('Calibração Display', 'Display Kalibratie', 'Display Calibration', 'display-calib', 30, ARRAY[2,3], 39.99, 15, 'monitor', '#06b6d4');

INSERT INTO public.vip_slot_rules (plan_level, time_from, time_until, reserved_slots, release_hours_before) VALUES
  (3, '09:00', '12:00', 1, 24),
  (3, '14:00', '17:00', 1, 24);
