-- Eliminar la política INSERT permisiva que causa el problema de seguridad
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

-- Crear una política más restrictiva: solo el trigger (SECURITY DEFINER) puede insertar
-- No necesitamos una política INSERT pública porque el trigger handle_new_user 
-- ya tiene SECURITY DEFINER y bypasea RLS
-- Si algún día necesitamos que usuarios inserten su propio perfil:
CREATE POLICY "Users can only insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Agregar política para que usuarios puedan actualizar solo su propio perfil (campos no sensibles)
-- Nota: is_approved solo puede ser cambiado por admins (política existente)
CREATE POLICY "Users can update their own profile non-sensitive fields" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_approved = (SELECT is_approved FROM public.profiles WHERE user_id = auth.uid()));