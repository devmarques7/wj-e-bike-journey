
CREATE TABLE public.appointment_qc_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  template_id uuid,
  stage_name text,
  stage_position integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer,
  task_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, stage_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_qc_progress TO authenticated;
GRANT ALL ON public.appointment_qc_progress TO service_role;

ALTER TABLE public.appointment_qc_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qcp_read"
  ON public.appointment_qc_progress FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_qc_progress.appointment_id
        AND (a.user_id = auth.uid() OR a.assigned_mechanic_id = auth.uid())
    )
  );

CREATE POLICY "qcp_write"
  ON public.appointment_qc_progress FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE INDEX idx_qcp_appointment ON public.appointment_qc_progress(appointment_id);
CREATE INDEX idx_qcp_stage ON public.appointment_qc_progress(stage_id);

CREATE TRIGGER trg_qcp_updated_at
  BEFORE UPDATE ON public.appointment_qc_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
