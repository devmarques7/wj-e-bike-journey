CREATE UNIQUE INDEX IF NOT EXISTS customer_bikes_one_active_per_customer
ON public.customer_bikes (customer_id)
WHERE is_active = true;