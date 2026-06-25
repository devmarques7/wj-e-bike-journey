
-- Allow customers to manage their own bikes and enforce globally unique serials
CREATE POLICY "cb_owner_insert" ON public.customer_bikes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customer_profiles cp
      WHERE cp.id = customer_bikes.customer_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "cb_owner_update" ON public.customer_bikes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles cp
      WHERE cp.id = customer_bikes.customer_id AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customer_profiles cp
      WHERE cp.id = customer_bikes.customer_id AND cp.user_id = auth.uid()
    )
  );

-- Each physical bike (serial) can only be registered once
CREATE UNIQUE INDEX IF NOT EXISTS customer_bikes_unique_serial
  ON public.customer_bikes (serial)
  WHERE serial IS NOT NULL;

-- Also ensure customers can create their own customer_profiles row when registering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid='public.customer_profiles'::regclass AND polname='cp_owner_insert'
  ) THEN
    CREATE POLICY "cp_owner_insert" ON public.customer_profiles
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
