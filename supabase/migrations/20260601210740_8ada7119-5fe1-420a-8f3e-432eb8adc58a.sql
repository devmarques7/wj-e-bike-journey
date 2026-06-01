
-- =====================================================
-- CRM & MEMBERSHIP — FOUNDATION
-- =====================================================

-- ENUMS
CREATE TYPE public.lifecycle_stage_enum AS ENUM (
  'lead','new','active_subscriber','loyal','at_risk','churned'
);
CREATE TYPE public.interaction_type_enum AS ENUM (
  'call','whatsapp','email','in_person','other'
);
CREATE TYPE public.interaction_direction_enum AS ENUM ('inbound','outbound');
CREATE TYPE public.note_type_enum AS ENUM (
  'general','complaint','compliment','followup','opportunity'
);
CREATE TYPE public.segment_type_enum AS ENUM ('dynamic','static');

-- =====================================================
-- customer_profiles
-- =====================================================
CREATE TABLE public.customer_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE,
  assigned_to     uuid,
  lifecycle_stage lifecycle_stage_enum NOT NULL DEFAULT 'new',
  health_score    integer NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  churn_risk_score integer NOT NULL DEFAULT 0 CHECK (churn_risk_score BETWEEN 0 AND 100),
  ltv_estimated   numeric(10,2) NOT NULL DEFAULT 0,
  total_spent     numeric(10,2) NOT NULL DEFAULT 0,
  rfm_score       integer NOT NULL DEFAULT 0,
  last_contact_at timestamptz,
  tags            text[] NOT NULL DEFAULT '{}',
  notes_count     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cp_lifecycle ON public.customer_profiles(lifecycle_stage);
CREATE INDEX idx_cp_health    ON public.customer_profiles(health_score);
CREATE INDEX idx_cp_churn     ON public.customer_profiles(churn_risk_score DESC);
CREATE INDEX idx_cp_tags      ON public.customer_profiles USING GIN(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_profiles TO authenticated;
GRANT ALL ON public.customer_profiles TO service_role;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY cp_read ON public.customer_profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role) OR user_id = auth.uid());
CREATE POLICY cp_write ON public.customer_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_cp_updated_at BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- =====================================================
-- customer_interactions
-- =====================================================
CREATE TABLE public.customer_interactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  type          interaction_type_enum NOT NULL,
  direction     interaction_direction_enum NOT NULL DEFAULT 'outbound',
  duration_min  integer,
  subject       text,
  summary       text,
  outcome       text,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ci_customer ON public.customer_interactions(customer_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_interactions TO authenticated;
GRANT ALL ON public.customer_interactions TO service_role;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ci_read ON public.customer_interactions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY ci_write ON public.customer_interactions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

-- =====================================================
-- customer_notes
-- =====================================================
CREATE TABLE public.customer_notes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  note_type             note_type_enum NOT NULL DEFAULT 'general',
  content               text NOT NULL,
  is_pinned             boolean NOT NULL DEFAULT false,
  followup_date         date,
  followup_done         boolean NOT NULL DEFAULT false,
  linked_appointment_id uuid,
  linked_order_id       uuid,
  created_by            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cn_customer ON public.customer_notes(customer_id, created_at DESC);
CREATE INDEX idx_cn_followup ON public.customer_notes(followup_date) WHERE followup_done = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY cn_read ON public.customer_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY cn_write ON public.customer_notes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_cn_updated_at BEFORE UPDATE ON public.customer_notes
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- =====================================================
-- customer_segments + members
-- =====================================================
CREATE TABLE public.customer_segments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  segment_type segment_type_enum NOT NULL DEFAULT 'dynamic',
  conditions   jsonb NOT NULL DEFAULT '[]'::jsonb,
  color        text NOT NULL DEFAULT '#e8593c',
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_segments TO authenticated;
GRANT ALL ON public.customer_segments TO service_role;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY cs_read ON public.customer_segments FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY cs_write ON public.customer_segments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_cs_updated_at BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE public.customer_segment_members (
  segment_id  uuid NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (segment_id, customer_id)
);
CREATE INDEX idx_csm_customer ON public.customer_segment_members(customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_segment_members TO authenticated;
GRANT ALL ON public.customer_segment_members TO service_role;
ALTER TABLE public.customer_segment_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY csm_read ON public.customer_segment_members FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY csm_write ON public.customer_segment_members FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

-- =====================================================
-- customer_health_snapshots (mensal)
-- =====================================================
CREATE TABLE public.customer_health_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  snapshot_date   date NOT NULL,
  health_score    integer NOT NULL,
  lifecycle_stage lifecycle_stage_enum NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, snapshot_date)
);
CREATE INDEX idx_chs_date ON public.customer_health_snapshots(snapshot_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_health_snapshots TO authenticated;
GRANT ALL ON public.customer_health_snapshots TO service_role;
ALTER TABLE public.customer_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY chs_read ON public.customer_health_snapshots FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY chs_write ON public.customer_health_snapshots FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

-- =====================================================
-- customer_bikes
-- =====================================================
CREATE TABLE public.customer_bikes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  model           text NOT NULL,
  serial          text,
  color           text,
  image_url       text,
  purchased_at    date,
  km              integer NOT NULL DEFAULT 0,
  last_service_at date,
  next_service_at date,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cb_customer ON public.customer_bikes(customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_bikes TO authenticated;
GRANT ALL ON public.customer_bikes TO service_role;
ALTER TABLE public.customer_bikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY cb_read ON public.customer_bikes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role)
         OR EXISTS (SELECT 1 FROM public.customer_profiles cp WHERE cp.id = customer_bikes.customer_id AND cp.user_id = auth.uid()));
CREATE POLICY cb_write ON public.customer_bikes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

CREATE TRIGGER trg_cb_updated_at BEFORE UPDATE ON public.customer_bikes
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- =====================================================
-- RPCs
-- =====================================================
CREATE OR REPLACE FUNCTION public.fn_register_contact(
  p_customer_id uuid,
  p_type interaction_type_enum,
  p_direction interaction_direction_enum,
  p_duration_min integer DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_outcome text DEFAULT NULL
) RETURNS customer_interactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.customer_interactions;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO public.customer_interactions (customer_id, type, direction, duration_min, subject, summary, outcome, created_by)
  VALUES (p_customer_id, p_type, p_direction, p_duration_min, p_subject, p_summary, p_outcome, auth.uid())
  RETURNING * INTO v_row;
  UPDATE public.customer_profiles SET last_contact_at = now() WHERE id = p_customer_id;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.fn_log_customer_note(
  p_customer_id uuid,
  p_content text,
  p_note_type note_type_enum DEFAULT 'general',
  p_is_pinned boolean DEFAULT false,
  p_followup_date date DEFAULT NULL,
  p_linked_appointment_id uuid DEFAULT NULL,
  p_linked_order_id uuid DEFAULT NULL
) RETURNS customer_notes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.customer_notes;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO public.customer_notes (customer_id, note_type, content, is_pinned, followup_date, linked_appointment_id, linked_order_id, created_by)
  VALUES (p_customer_id, p_note_type, p_content, p_is_pinned, p_followup_date, p_linked_appointment_id, p_linked_order_id, auth.uid())
  RETURNING * INTO v_row;
  UPDATE public.customer_profiles
     SET notes_count = notes_count + 1
   WHERE id = p_customer_id;
  RETURN v_row;
END $$;

-- =====================================================
-- SEED: bootstrap customer_profiles from existing profiles
-- =====================================================
INSERT INTO public.customer_profiles (user_id, lifecycle_stage, health_score, churn_risk_score, ltv_estimated, total_spent, rfm_score, last_contact_at, tags)
SELECT
  p.user_id,
  (ARRAY['new','active_subscriber','active_subscriber','loyal','at_risk','churned']::lifecycle_stage_enum[])[1 + (abs(hashtext(p.user_id::text)) % 6)],
  30 + (abs(hashtext(p.user_id::text || 'h')) % 70),
  (abs(hashtext(p.user_id::text || 'c')) % 100),
  100 + (abs(hashtext(p.user_id::text || 'l')) % 2000),
  50 + (abs(hashtext(p.user_id::text || 't')) % 1500),
  1 + (abs(hashtext(p.user_id::text || 'r')) % 15),
  now() - ((abs(hashtext(p.user_id::text || 'lc')) % 60) || ' days')::interval,
  CASE WHEN abs(hashtext(p.user_id::text)) % 3 = 0 THEN ARRAY['vip']
       WHEN abs(hashtext(p.user_id::text)) % 3 = 1 THEN ARRAY['promoter']
       ELSE ARRAY[]::text[] END
FROM public.profiles p
WHERE p.is_active = true
ON CONFLICT (user_id) DO NOTHING;

-- 12 monthly snapshots per customer for the area chart
INSERT INTO public.customer_health_snapshots (customer_id, snapshot_date, health_score, lifecycle_stage)
SELECT
  cp.id,
  (date_trunc('month', now()) - (m || ' months')::interval)::date,
  GREATEST(0, LEAST(100, cp.health_score + ((abs(hashtext(cp.id::text || m::text)) % 40) - 20))),
  cp.lifecycle_stage
FROM public.customer_profiles cp
CROSS JOIN generate_series(0, 11) AS m
ON CONFLICT (customer_id, snapshot_date) DO NOTHING;
