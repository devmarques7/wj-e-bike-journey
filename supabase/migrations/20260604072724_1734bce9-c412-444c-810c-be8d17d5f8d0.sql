ALTER TABLE public.appointment_qc_progress
  ADD COLUMN IF NOT EXISTS elapsed_from_start_seconds integer;

COMMENT ON COLUMN public.appointment_qc_progress.elapsed_from_start_seconds IS
  'Seconds elapsed from appointments.work_started_at until this stage completed_at (cumulative).';