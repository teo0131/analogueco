
-- Table for platform super-admins
CREATE TABLE public.platform_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Security definer function to check platform admin status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  )
$$;

-- RLS: only platform admins can read
CREATE POLICY "Platform admins can view"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Seed: add the owner as the first platform admin
INSERT INTO public.platform_admins (user_id)
VALUES ('ac808997-ced6-4791-8a2a-1eb596265c55');
