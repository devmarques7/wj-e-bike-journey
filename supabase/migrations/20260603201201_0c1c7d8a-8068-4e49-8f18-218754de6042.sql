-- Seed Dutch public holidays for 2026 and 2027 into business_hour_exceptions.
-- Idempotent: only insert if a row for that date does not yet exist.
INSERT INTO public.business_hour_exceptions
  (exception_date, is_open, exception_type, open_time, close_time, reason, is_public_holiday)
SELECT d.exception_date, false, 'closed', NULL, NULL, d.reason, true
FROM (VALUES
  ('2026-01-01'::date, 'Nieuwjaarsdag'),
  ('2026-04-03'::date, 'Goede Vrijdag'),
  ('2026-04-05'::date, 'Eerste Paasdag'),
  ('2026-04-06'::date, 'Tweede Paasdag'),
  ('2026-04-27'::date, 'Koningsdag'),
  ('2026-05-05'::date, 'Bevrijdingsdag'),
  ('2026-05-14'::date, 'Hemelvaartsdag'),
  ('2026-05-24'::date, 'Eerste Pinksterdag'),
  ('2026-05-25'::date, 'Tweede Pinksterdag'),
  ('2026-12-25'::date, 'Eerste Kerstdag'),
  ('2026-12-26'::date, 'Tweede Kerstdag'),
  ('2027-01-01'::date, 'Nieuwjaarsdag'),
  ('2027-03-26'::date, 'Goede Vrijdag'),
  ('2027-03-28'::date, 'Eerste Paasdag'),
  ('2027-03-29'::date, 'Tweede Paasdag'),
  ('2027-04-27'::date, 'Koningsdag'),
  ('2027-05-05'::date, 'Bevrijdingsdag'),
  ('2027-05-06'::date, 'Hemelvaartsdag'),
  ('2027-05-16'::date, 'Eerste Pinksterdag'),
  ('2027-05-17'::date, 'Tweede Pinksterdag'),
  ('2027-12-25'::date, 'Eerste Kerstdag'),
  ('2027-12-26'::date, 'Tweede Kerstdag')
) AS d(exception_date, reason)
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_hour_exceptions b
  WHERE b.exception_date = d.exception_date
);