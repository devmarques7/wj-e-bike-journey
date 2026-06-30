
-- Normalize existing serials and enforce global uniqueness (case-insensitive)
UPDATE public.customer_bikes SET serial = upper(trim(serial)) WHERE serial IS NOT NULL;

-- De-duplicate to allow unique index: deactivate duplicates keeping the oldest
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY lower(serial) ORDER BY created_at ASC) AS rn
  FROM public.customer_bikes
  WHERE serial IS NOT NULL
)
UPDATE public.customer_bikes cb
SET is_active = false
FROM ranked r
WHERE cb.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS customer_bikes_serial_unique_idx
  ON public.customer_bikes ((lower(serial))) WHERE serial IS NOT NULL;

-- Security definer helper so users can check serial availability without
-- being able to read other users' bikes via RLS.
CREATE OR REPLACE FUNCTION public.is_bike_serial_available(_serial text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.customer_bikes
    WHERE lower(serial) = lower(trim(_serial))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_bike_serial_available(text) TO authenticated;
