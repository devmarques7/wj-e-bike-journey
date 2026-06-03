
INSERT INTO public.plans (slug, name, tier_level, description, color_hex, display_order, is_active)
SELECT 'free', 'Free', 0, 'View-only access to the dashboard and bike details.', '#6b7280', 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'free');

INSERT INTO public.plan_versions (plan_id, version_number, price, currency, interval, trial_days, features, status, effective_from)
SELECT p.id, 1, 0, 'EUR', 'monthly'::plan_interval_enum, 0,
       '["View dashboard", "View bike details"]'::jsonb,
       'active'::plan_version_status_enum, now()
FROM public.plans p
WHERE p.slug = 'free'
  AND NOT EXISTS (SELECT 1 FROM public.plan_versions WHERE plan_id = p.id);
