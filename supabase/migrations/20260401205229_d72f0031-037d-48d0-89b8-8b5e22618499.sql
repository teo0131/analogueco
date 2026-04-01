
-- =============================================
-- FASE 1: Estructura base multi-tenant
-- =============================================

-- 1. Tabla de comercios (tenants)
CREATE TABLE public.comercios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  nombre TEXT NOT NULL DEFAULT 'Mi Negocio',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de membresías (quién pertenece a qué comercio)
CREATE TYPE public.comercio_role AS ENUM ('owner', 'admin', 'user');

CREATE TABLE public.comercio_miembros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rol comercio_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comercio_id, user_id)
);

ALTER TABLE public.comercio_miembros ENABLE ROW LEVEL SECURITY;

-- 3. Agregar comercio_id a profiles (nullable por ahora)
ALTER TABLE public.profiles ADD COLUMN comercio_id UUID REFERENCES public.comercios(id);

-- 4. Funciones helper (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.get_user_comercio_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT comercio_id FROM public.comercio_miembros
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_comercio_role(_user_id UUID)
RETURNS comercio_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.comercio_miembros
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_comercio_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comercio_miembros
    WHERE user_id = _user_id AND rol = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_same_comercio(_user_id UUID, _other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comercio_miembros cm1
    JOIN public.comercio_miembros cm2 ON cm1.comercio_id = cm2.comercio_id
    WHERE cm1.user_id = _user_id AND cm2.user_id = _other_user_id
  )
$$;

-- 5. RLS para comercios
CREATE POLICY "Members can view their own comercio"
ON public.comercios FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.comercio_miembros
    WHERE comercio_miembros.comercio_id = comercios.id
    AND comercio_miembros.user_id = auth.uid()
  )
);

CREATE POLICY "Only owners can update their comercio"
ON public.comercios FOR UPDATE
USING (owner_user_id = auth.uid());

CREATE POLICY "Authenticated users can create comercios"
ON public.comercios FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

-- 6. RLS para comercio_miembros
CREATE POLICY "Members can view their comercio members"
ON public.comercio_miembros FOR SELECT
USING (
  get_user_comercio_id(auth.uid()) = comercio_id
);

CREATE POLICY "Owners can manage members"
ON public.comercio_miembros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.comercio_miembros cm
    WHERE cm.comercio_id = comercio_miembros.comercio_id
    AND cm.user_id = auth.uid()
    AND cm.rol = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comercio_miembros cm
    WHERE cm.comercio_id = comercio_miembros.comercio_id
    AND cm.user_id = auth.uid()
    AND cm.rol = 'owner'
  )
);

-- Users can always insert themselves (for initial signup)
CREATE POLICY "Users can insert own membership"
ON public.comercio_miembros FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 7. Trigger: updated_at para comercios
CREATE TRIGGER update_comercios_updated_at
BEFORE UPDATE ON public.comercios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Migrar datos existentes: crear comercio por cada owner/usuario con datos
-- Crear un comercio para cada usuario que tiene un profile
INSERT INTO public.comercios (id, owner_user_id, nombre)
SELECT 
  gen_random_uuid(),
  p.user_id,
  COALESCE(us.store_name, p.email, 'Mi Negocio')
FROM public.profiles p
LEFT JOIN public.user_settings us ON us.user_id = p.user_id;

-- Crear membresía owner para cada usuario existente
INSERT INTO public.comercio_miembros (comercio_id, user_id, rol)
SELECT c.id, c.owner_user_id, 'owner'
FROM public.comercios c;

-- Actualizar profiles con su comercio_id
UPDATE public.profiles p
SET comercio_id = c.id
FROM public.comercios c
WHERE c.owner_user_id = p.user_id;

-- 9. Actualizar trigger handle_new_user para crear comercio automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_comercio_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, is_approved)
  VALUES (NEW.id, NEW.email, false);
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create comercio for new user
  INSERT INTO public.comercios (owner_user_id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'store_name', 'Mi Negocio'))
  RETURNING id INTO new_comercio_id;
  
  -- Create membership as owner
  INSERT INTO public.comercio_miembros (comercio_id, user_id, rol)
  VALUES (new_comercio_id, NEW.id, 'owner');
  
  -- Link profile to comercio
  UPDATE public.profiles SET comercio_id = new_comercio_id WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;
