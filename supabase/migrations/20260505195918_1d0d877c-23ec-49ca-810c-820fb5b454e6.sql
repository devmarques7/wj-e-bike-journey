UPDATE auth.users
SET email_confirmed_at = now()
WHERE email IN (
  'admin@wjvision.com',
  'staff@wjvision.com',
  'light@wjvision.com',
  'plus@wjvision.com',
  'black@wjvision.com'
)
AND email_confirmed_at IS NULL;