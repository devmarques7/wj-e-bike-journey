-- Restrict Stripe identifiers from public/authenticated reads (column-level)
REVOKE SELECT (stripe_product_id) ON public.plans FROM anon, authenticated;
REVOKE SELECT (stripe_price_id) ON public.plan_versions FROM anon, authenticated;

-- Ensure remaining columns are still readable (re-grant explicit columns)
GRANT SELECT (id, name, slug, tier_level, description, color_hex, icon, display_order, is_active, created_at, updated_at)
  ON public.plans TO anon, authenticated;

GRANT SELECT (id, plan_id, version_number, price, currency, interval, trial_days, features, status, effective_from, created_at)
  ON public.plan_versions TO anon, authenticated;