
-- Step 2: Create is_owner helper function and update RLS policies

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Update user_roles RLS: owners manage all, admins can view
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Owners can manage all roles" ON public.user_roles
  FOR ALL
  TO public
  USING (is_owner(auth.uid()))
  WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update profiles RLS: owners + admins can view/update all profiles
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins and owners can view all profiles" ON public.profiles
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Admins and owners can update profiles" ON public.profiles
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));
