
-- ============ ENUMS ============
CREATE TYPE public.plan_interval_enum AS ENUM ('monthly','quarterly','yearly','lifetime');
CREATE TYPE public.plan_version_status_enum AS ENUM ('draft','active','archived');
CREATE TYPE public.subscription_status_enum AS ENUM ('trialing','active','past_due','canceled','paused');
CREATE TYPE public.payment_method_enum AS ENUM ('stripe_card','stripe_sepa','cash','bank_transfer','pos_card','other');
CREATE TYPE public.payment_status_enum AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE public.subscription_event_enum AS ENUM ('created','upgraded','downgraded','paused','resumed','canceled','reactivated','payment_failed','payment_succeeded','manual_payment');

-- ============ PLANS ============
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tier_level int NOT NULL DEFAULT 0,
  description text,
  color_hex text,
  icon text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  stripe_product_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PLAN VERSIONS ============
CREATE TABLE public.plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  interval plan_interval_enum NOT NULL DEFAULT 'monthly',
  trial_days int NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  status plan_version_status_enum NOT NULL DEFAULT 'draft',
  effective_from timestamptz NOT NULL DEFAULT now(),
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, version_number)
);
CREATE INDEX idx_plan_versions_plan ON public.plan_versions(plan_id, status);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_version_id uuid NOT NULL REFERENCES public.plan_versions(id),
  status subscription_status_enum NOT NULL DEFAULT 'active',
  payment_method payment_method_enum,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUBSCRIPTION EVENTS (append-only) ============
CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type subscription_event_enum NOT NULL,
  from_plan_version_id uuid REFERENCES public.plan_versions(id),
  to_plan_version_id uuid REFERENCES public.plan_versions(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sub_events_sub ON public.subscription_events(subscription_id, created_at DESC);

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status payment_status_enum NOT NULL DEFAULT 'succeeded',
  method payment_method_enum NOT NULL,
  stripe_payment_intent_id text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  period_start timestamptz,
  period_end timestamptz,
  recorded_by uuid,
  notes text,
  invoice_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_sub ON public.payments(subscription_id, paid_at DESC);
CREATE INDEX idx_payments_user ON public.payments(user_id, paid_at DESC);

-- ============ PAYMENT METHODS ============
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_payment_method_id text NOT NULL,
  brand text,
  last4 text,
  exp_month int,
  exp_year int,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pm_user ON public.payment_methods(user_id);

-- ============ RLS ============
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- plans
CREATE POLICY "plans_read_all" ON public.plans FOR SELECT USING (true);
CREATE POLICY "plans_admin_write" ON public.plans FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- plan_versions
CREATE POLICY "pv_read_all" ON public.plan_versions FOR SELECT USING (true);
CREATE POLICY "pv_admin_write" ON public.plan_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- subscriptions
CREATE POLICY "subs_read_own_or_staff" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "subs_admin_write" ON public.subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- subscription_events (insert + read only)
CREATE POLICY "se_read" ON public.subscription_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role)
         OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_id AND s.user_id = auth.uid()));
CREATE POLICY "se_insert_admin" ON public.subscription_events FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

-- payments
CREATE POLICY "pay_read_own_or_staff" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "pay_insert_admin" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));

-- payment_methods
CREATE POLICY "pm_read_own_or_admin" ON public.payment_methods FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "pm_admin_write" ON public.payment_methods FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- ============ VIEWS ============
CREATE OR REPLACE VIEW public.v_plan_kpis AS
SELECT
  p.id AS plan_id,
  p.name,
  p.slug,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS active_subs,
  COALESCE(SUM(
    CASE WHEN s.status='active' THEN
      CASE pv.interval
        WHEN 'monthly' THEN pv.price
        WHEN 'quarterly' THEN pv.price/3
        WHEN 'yearly' THEN pv.price/12
        ELSE 0 END
    ELSE 0 END
  ),0) AS mrr,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status='canceled' AND s.canceled_at > now() - interval '30 days') AS churn_30d
FROM public.plans p
LEFT JOIN public.plan_versions pv ON pv.plan_id = p.id
LEFT JOIN public.subscriptions s ON s.plan_version_id = pv.id
GROUP BY p.id, p.name, p.slug;

CREATE OR REPLACE VIEW public.v_subscriber_summary AS
SELECT
  s.user_id,
  s.id AS subscription_id,
  s.status,
  s.current_period_end,
  pv.id AS plan_version_id,
  pv.plan_id,
  pv.price,
  pv.interval,
  COALESCE(SUM(pay.amount) FILTER (WHERE pay.status='succeeded'),0) AS lifetime_value,
  COUNT(pay.id) FILTER (WHERE pay.status='succeeded') AS payments_count,
  MAX(pay.paid_at) FILTER (WHERE pay.status='succeeded') AS last_payment_at,
  CASE
    WHEN s.status <> 'active' THEN 0
    WHEN MAX(pay.paid_at) IS NULL THEN 50
    WHEN MAX(pay.paid_at) < now() - interval '60 days' THEN 80
    WHEN MAX(pay.paid_at) < now() - interval '40 days' THEN 50
    ELSE 10
  END AS churn_risk_score
FROM public.subscriptions s
JOIN public.plan_versions pv ON pv.id = s.plan_version_id
LEFT JOIN public.payments pay ON pay.subscription_id = s.id
GROUP BY s.id, s.user_id, s.status, s.current_period_end, pv.id;

CREATE OR REPLACE VIEW public.v_mrr_timeseries AS
SELECT
  date_trunc('month', paid_at)::date AS month,
  SUM(amount) AS revenue,
  COUNT(*) AS payments_count
FROM public.payments
WHERE status = 'succeeded'
GROUP BY 1
ORDER BY 1;

-- ============ RPC FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.fn_create_plan_version(
  p_plan_id uuid,
  p_price numeric,
  p_currency text DEFAULT 'EUR',
  p_interval plan_interval_enum DEFAULT 'monthly',
  p_trial_days int DEFAULT 0,
  p_features jsonb DEFAULT '[]'::jsonb,
  p_activate boolean DEFAULT true
) RETURNS public.plan_versions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next int;
  v_row public.plan_versions;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(MAX(version_number),0)+1 INTO v_next
  FROM public.plan_versions WHERE plan_id = p_plan_id;

  IF p_activate THEN
    UPDATE public.plan_versions SET status='archived'
    WHERE plan_id = p_plan_id AND status='active';
  END IF;

  INSERT INTO public.plan_versions
    (plan_id, version_number, price, currency, interval, trial_days, features, status)
  VALUES
    (p_plan_id, v_next, p_price, p_currency, p_interval, p_trial_days, p_features,
     CASE WHEN p_activate THEN 'active'::plan_version_status_enum ELSE 'draft'::plan_version_status_enum END)
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.fn_register_manual_payment(
  p_subscription_id uuid,
  p_amount numeric,
  p_method payment_method_enum,
  p_period_start timestamptz DEFAULT NULL,
  p_period_end timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sub public.subscriptions;
  v_pay public.payments;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;

  INSERT INTO public.payments
    (subscription_id, user_id, amount, currency, status, method, paid_at,
     period_start, period_end, recorded_by, notes)
  VALUES
    (p_subscription_id, v_sub.user_id, p_amount, 'EUR', 'succeeded', p_method, now(),
     COALESCE(p_period_start, v_sub.current_period_start),
     COALESCE(p_period_end,   v_sub.current_period_end),
     auth.uid(), p_notes)
  RETURNING * INTO v_pay;

  IF p_period_end IS NOT NULL THEN
    UPDATE public.subscriptions
       SET current_period_start = COALESCE(p_period_start, current_period_start),
           current_period_end   = p_period_end,
           status = 'active'
     WHERE id = p_subscription_id;
  END IF;

  INSERT INTO public.subscription_events (subscription_id, event_type, metadata, created_by)
  VALUES (p_subscription_id, 'manual_payment',
          jsonb_build_object('amount', p_amount, 'method', p_method, 'payment_id', v_pay.id),
          auth.uid());

  RETURN v_pay;
END $$;

CREATE OR REPLACE FUNCTION public.fn_change_subscription_plan(
  p_subscription_id uuid,
  p_new_plan_version_id uuid
) RETURNS public.subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old uuid;
  v_old_tier int;
  v_new_tier int;
  v_event subscription_event_enum;
  v_row public.subscriptions;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT plan_version_id INTO v_old FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription not found'; END IF;

  SELECT p.tier_level INTO v_old_tier FROM public.plan_versions pv JOIN public.plans p ON p.id=pv.plan_id WHERE pv.id=v_old;
  SELECT p.tier_level INTO v_new_tier FROM public.plan_versions pv JOIN public.plans p ON p.id=pv.plan_id WHERE pv.id=p_new_plan_version_id;

  v_event := CASE WHEN v_new_tier > v_old_tier THEN 'upgraded'::subscription_event_enum
                  WHEN v_new_tier < v_old_tier THEN 'downgraded'::subscription_event_enum
                  ELSE 'created'::subscription_event_enum END;

  UPDATE public.subscriptions
     SET plan_version_id = p_new_plan_version_id, updated_at = now()
   WHERE id = p_subscription_id
   RETURNING * INTO v_row;

  INSERT INTO public.subscription_events
    (subscription_id, event_type, from_plan_version_id, to_plan_version_id, created_by)
  VALUES (p_subscription_id, v_event, v_old, p_new_plan_version_id, auth.uid());

  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.fn_cancel_subscription(
  p_subscription_id uuid,
  p_at_period_end boolean DEFAULT true
) RETURNS public.subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.subscriptions;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.subscriptions
     SET cancel_at_period_end = p_at_period_end,
         status = CASE WHEN p_at_period_end THEN status ELSE 'canceled'::subscription_status_enum END,
         canceled_at = CASE WHEN p_at_period_end THEN canceled_at ELSE now() END
   WHERE id = p_subscription_id
   RETURNING * INTO v_row;

  INSERT INTO public.subscription_events (subscription_id, event_type, created_by, metadata)
  VALUES (p_subscription_id, 'canceled', auth.uid(),
          jsonb_build_object('at_period_end', p_at_period_end));

  RETURN v_row;
END $$;

-- ============ SEED: Light / Plus / Black ============
INSERT INTO public.plans (name, slug, tier_level, description, color_hex, display_order) VALUES
  ('Light','light',1,'Essential coverage for your e-bike.','#94a3b8',1),
  ('Plus','plus',2,'Extended care, priority service, accessories discount.','#058c42',2),
  ('Black','black',3,'All-inclusive premium membership with concierge.','#0a0a0a',3);

INSERT INTO public.plan_versions (plan_id, version_number, price, interval, status, features)
SELECT id, 1, 9.90, 'monthly', 'active',
  '["Annual checkup","24/7 chat support","5% accessories discount"]'::jsonb
FROM public.plans WHERE slug='light';

INSERT INTO public.plan_versions (plan_id, version_number, price, interval, status, features)
SELECT id, 1, 19.90, 'monthly', 'active',
  '["Bi-annual service","Priority booking","10% accessories discount","Loaner bike"]'::jsonb
FROM public.plans WHERE slug='plus';

INSERT INTO public.plan_versions (plan_id, version_number, price, interval, status, features)
SELECT id, 1, 39.90, 'monthly', 'active',
  '["Unlimited service","Same-day pickup","20% accessories discount","Concierge","Insurance included"]'::jsonb
FROM public.plans WHERE slug='black';
