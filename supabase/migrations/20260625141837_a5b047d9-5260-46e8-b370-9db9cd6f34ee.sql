
ALTER TABLE public.customer_bikes
  ADD COLUMN IF NOT EXISTS services_completed integer NOT NULL DEFAULT 0;
