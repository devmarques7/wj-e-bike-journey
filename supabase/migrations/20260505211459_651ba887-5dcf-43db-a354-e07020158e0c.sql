-- Add flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_complete_profile boolean NOT NULL DEFAULT false;

-- Pre-registration / invitations table
CREATE TABLE IF NOT EXISTS public.member_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  invited_by uuid,
  user_id uuid,
  status text NOT NULL DEFAULT 'pending', -- pending | completed | revoked
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_invitations_email ON public.member_invitations (lower(email));
CREATE INDEX IF NOT EXISTS idx_member_invitations_user_id ON public.member_invitations (user_id);

ALTER TABLE public.member_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations"
ON public.member_invitations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert invitations"
ON public.member_invitations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invitations"
ON public.member_invitations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations"
ON public.member_invitations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_member_invitations_updated_at
BEFORE UPDATE ON public.member_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();