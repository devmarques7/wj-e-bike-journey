
-- ============ qc_templates ============
CREATE TABLE public.qc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.qc_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.qc_templates TO authenticated;
GRANT ALL ON public.qc_templates TO service_role;

ALTER TABLE public.qc_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY qc_templates_read ON public.qc_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY qc_templates_write ON public.qc_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_qc_templates_updated_at
BEFORE UPDATE ON public.qc_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Only one default
CREATE OR REPLACE FUNCTION public.fn_enforce_single_default_qc_template()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.qc_templates SET is_default = false
     WHERE id <> NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_qc_templates_single_default
BEFORE INSERT OR UPDATE ON public.qc_templates
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_single_default_qc_template();

-- ============ qc_stages ============
CREATE TABLE public.qc_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.qc_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  requires_photo boolean NOT NULL DEFAULT false,
  photo_min_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX qc_stages_template_idx ON public.qc_stages(template_id, position);

GRANT SELECT ON public.qc_stages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.qc_stages TO authenticated;
GRANT ALL ON public.qc_stages TO service_role;

ALTER TABLE public.qc_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY qc_stages_read ON public.qc_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY qc_stages_write ON public.qc_stages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_qc_stages_updated_at
BEFORE UPDATE ON public.qc_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ qc_tasks ============
CREATE TABLE public.qc_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.qc_stages(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX qc_tasks_stage_idx ON public.qc_tasks(stage_id, position);

GRANT SELECT ON public.qc_tasks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.qc_tasks TO authenticated;
GRANT ALL ON public.qc_tasks TO service_role;

ALTER TABLE public.qc_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY qc_tasks_read ON public.qc_tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY qc_tasks_write ON public.qc_tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_qc_tasks_updated_at
BEFORE UPDATE ON public.qc_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default template so the workshop has something to start with
INSERT INTO public.qc_templates (name, description, is_default, is_active)
VALUES ('Controlo de Qualidade Padrão', 'Sequência padrão de verificação para todos os agendamentos de oficina.', true, true);
