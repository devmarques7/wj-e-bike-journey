
-- Restrict column visibility on public.plans (hide stripe_product_id)
REVOKE SELECT ON public.plans FROM anon, authenticated;
GRANT SELECT (
  id, name, slug, tier_level, description, color_hex, icon,
  display_order, is_active, is_default, created_at, updated_at
) ON public.plans TO anon, authenticated;

-- Restrict column visibility on public.plan_versions (hide stripe_price_id)
REVOKE SELECT ON public.plan_versions FROM anon, authenticated;
GRANT SELECT (
  id, plan_id, version_number, price, currency, interval,
  trial_days, features, status, effective_from, created_at
) ON public.plan_versions TO anon, authenticated;
