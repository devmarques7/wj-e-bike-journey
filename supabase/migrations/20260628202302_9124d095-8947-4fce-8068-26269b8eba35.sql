ALTER TABLE public.plan_versions
  ADD COLUMN IF NOT EXISTS urgent_service_included boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS urgent_service_fee numeric(10,2) NOT NULL DEFAULT 0;

UPDATE public.plan_versions pv
   SET urgent_service_included = true,
       urgent_service_fee = CASE
         WHEN p.slug IN ('free','light') THEN 100
         ELSE 0
       END
  FROM public.plans p
 WHERE pv.plan_id = p.id;