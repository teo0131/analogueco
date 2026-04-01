
-- ========================================
-- FASE 2-5: Complete multi-tenant migration
-- ========================================

-- Fix Phase 1: comercio_miembros RLS self-reference
CREATE OR REPLACE FUNCTION public.is_comercio_owner_of(_user_id UUID, _comercio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.comercio_miembros WHERE user_id = _user_id AND comercio_id = _comercio_id AND rol = 'owner')
$$;

DROP POLICY IF EXISTS "Owners can manage members" ON public.comercio_miembros;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.comercio_miembros;

CREATE POLICY "Owners can manage members"
ON public.comercio_miembros FOR ALL
USING (public.is_comercio_owner_of(auth.uid(), comercio_id))
WITH CHECK (public.is_comercio_owner_of(auth.uid(), comercio_id));

-- Add invite_code to comercios
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
UPDATE public.comercios SET invite_code = substr(md5(random()::text || id::text), 1, 8) WHERE invite_code IS NULL;

-- Add comercio_id to all parent tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items','productos','proveedores','ordenes_pos','ordenes_activas',
    'ordenes_eliminadas_pos','mesas','elementos_planta','sesiones_caja',
    'entradas_inventario','entradas_menu','movimientos_inventario','recetas',
    'ordenes_compra','gastos_operativos','cuentas_por_cobrar','cuentas_por_pagar',
    'recordatorios_pago','clientes_cuenta','ventas_credito','pagos_cuenta',
    'facturas_fisicas','datos_fiscales','empleados','registros_asistencia',
    'nominas','documentos_empleados','crm_contactos','crm_conversaciones',
    'crm_mensajes','user_settings','chat_conversations','domicilios'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS comercio_id UUID REFERENCES public.comercios(id)', t);
  END LOOP;
END $$;

-- Populate comercio_id from existing data
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items','productos','proveedores','ordenes_pos','ordenes_activas',
    'ordenes_eliminadas_pos','mesas','elementos_planta','sesiones_caja',
    'entradas_inventario','entradas_menu','movimientos_inventario','recetas',
    'ordenes_compra','gastos_operativos','cuentas_por_cobrar','cuentas_por_pagar',
    'recordatorios_pago','clientes_cuenta','ventas_credito','pagos_cuenta',
    'facturas_fisicas','datos_fiscales','empleados','registros_asistencia',
    'nominas','documentos_empleados','crm_contactos','crm_conversaciones',
    'crm_mensajes','user_settings','chat_conversations','domicilios'
  ] LOOP
    EXECUTE format('UPDATE public.%I t SET comercio_id = c.id FROM public.comercios c WHERE c.owner_user_id = t.user_id AND t.comercio_id IS NULL', t);
  END LOOP;
END $$;

-- Auto-fill trigger function
CREATE OR REPLACE FUNCTION public.set_comercio_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.comercio_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.comercio_id := public.get_user_comercio_id(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Apply trigger to all parent tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items','productos','proveedores','ordenes_pos','ordenes_activas',
    'ordenes_eliminadas_pos','mesas','elementos_planta','sesiones_caja',
    'entradas_inventario','entradas_menu','movimientos_inventario','recetas',
    'ordenes_compra','gastos_operativos','cuentas_por_cobrar','cuentas_por_pagar',
    'recordatorios_pago','clientes_cuenta','ventas_credito','pagos_cuenta',
    'facturas_fisicas','datos_fiscales','empleados','registros_asistencia',
    'nominas','documentos_empleados','crm_contactos','crm_conversaciones',
    'crm_mensajes','user_settings','chat_conversations','domicilios'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_comercio_id ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_comercio_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_comercio_id_from_user()', t);
  END LOOP;
END $$;

-- Drop ALL old RLS policies on data tables (keep profiles, user_roles, comercios, comercio_miembros)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    AND tablename NOT IN ('profiles','user_roles','comercios','comercio_miembros')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Create new RLS for parent tables (full CRUD, comercio isolation)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'menu_items','productos','proveedores','ordenes_pos','ordenes_activas',
    'mesas','elementos_planta','sesiones_caja',
    'entradas_inventario','entradas_menu','recetas',
    'ordenes_compra','gastos_operativos','cuentas_por_cobrar','cuentas_por_pagar',
    'recordatorios_pago','clientes_cuenta','ventas_credito','pagos_cuenta',
    'facturas_fisicas','datos_fiscales','empleados','registros_asistencia',
    'nominas','documentos_empleados','crm_contactos','crm_conversaciones',
    'crm_mensajes','user_settings','chat_conversations','domicilios'
  ] LOOP
    EXECUTE format('CREATE POLICY "comercio_select" ON public.%I FOR SELECT USING (comercio_id = public.get_user_comercio_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "comercio_insert" ON public.%I FOR INSERT WITH CHECK (comercio_id = public.get_user_comercio_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "comercio_update" ON public.%I FOR UPDATE USING (comercio_id = public.get_user_comercio_id(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "comercio_delete" ON public.%I FOR DELETE USING (comercio_id = public.get_user_comercio_id(auth.uid()))', t);
  END LOOP;
END $$;

-- Audit tables (SELECT + INSERT only)
CREATE POLICY "comercio_select" ON public.movimientos_inventario FOR SELECT USING (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_insert" ON public.movimientos_inventario FOR INSERT WITH CHECK (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_select" ON public.ordenes_eliminadas_pos FOR SELECT USING (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_insert" ON public.ordenes_eliminadas_pos FOR INSERT WITH CHECK (comercio_id = public.get_user_comercio_id(auth.uid()));

-- Detail tables RLS (via parent comercio_id)
-- detalle_ordenes_pos
CREATE POLICY "comercio_select" ON public.detalle_ordenes_pos FOR SELECT USING (EXISTS (SELECT 1 FROM public.ordenes_pos p WHERE p.id = detalle_ordenes_pos.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_ordenes_pos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_pos p WHERE p.id = detalle_ordenes_pos.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_ordenes_pos FOR DELETE USING (EXISTS (SELECT 1 FROM public.ordenes_pos p WHERE p.id = detalle_ordenes_pos.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_ordenes_activas
CREATE POLICY "comercio_select" ON public.detalle_ordenes_activas FOR SELECT USING (EXISTS (SELECT 1 FROM public.ordenes_activas p WHERE p.id = detalle_ordenes_activas.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_ordenes_activas FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_activas p WHERE p.id = detalle_ordenes_activas.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_ordenes_activas FOR UPDATE USING (EXISTS (SELECT 1 FROM public.ordenes_activas p WHERE p.id = detalle_ordenes_activas.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_ordenes_activas FOR DELETE USING (EXISTS (SELECT 1 FROM public.ordenes_activas p WHERE p.id = detalle_ordenes_activas.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_entradas
CREATE POLICY "comercio_select" ON public.detalle_entradas FOR SELECT USING (EXISTS (SELECT 1 FROM public.entradas_inventario p WHERE p.id = detalle_entradas.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_entradas FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.entradas_inventario p WHERE p.id = detalle_entradas.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_entradas FOR UPDATE USING (EXISTS (SELECT 1 FROM public.entradas_inventario p WHERE p.id = detalle_entradas.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_entradas FOR DELETE USING (EXISTS (SELECT 1 FROM public.entradas_inventario p WHERE p.id = detalle_entradas.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_entradas_menu
CREATE POLICY "comercio_select" ON public.detalle_entradas_menu FOR SELECT USING (EXISTS (SELECT 1 FROM public.entradas_menu p WHERE p.id = detalle_entradas_menu.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_entradas_menu FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.entradas_menu p WHERE p.id = detalle_entradas_menu.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_entradas_menu FOR UPDATE USING (EXISTS (SELECT 1 FROM public.entradas_menu p WHERE p.id = detalle_entradas_menu.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_entradas_menu FOR DELETE USING (EXISTS (SELECT 1 FROM public.entradas_menu p WHERE p.id = detalle_entradas_menu.entrada_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_facturas_fisicas
CREATE POLICY "comercio_select" ON public.detalle_facturas_fisicas FOR SELECT USING (EXISTS (SELECT 1 FROM public.facturas_fisicas p WHERE p.id = detalle_facturas_fisicas.factura_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_facturas_fisicas FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.facturas_fisicas p WHERE p.id = detalle_facturas_fisicas.factura_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_facturas_fisicas FOR UPDATE USING (EXISTS (SELECT 1 FROM public.facturas_fisicas p WHERE p.id = detalle_facturas_fisicas.factura_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_facturas_fisicas FOR DELETE USING (EXISTS (SELECT 1 FROM public.facturas_fisicas p WHERE p.id = detalle_facturas_fisicas.factura_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_recetas
CREATE POLICY "comercio_select" ON public.detalle_recetas FOR SELECT USING (EXISTS (SELECT 1 FROM public.recetas p WHERE p.id = detalle_recetas.receta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_recetas FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.recetas p WHERE p.id = detalle_recetas.receta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_recetas FOR UPDATE USING (EXISTS (SELECT 1 FROM public.recetas p WHERE p.id = detalle_recetas.receta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_recetas FOR DELETE USING (EXISTS (SELECT 1 FROM public.recetas p WHERE p.id = detalle_recetas.receta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_ordenes_compra
CREATE POLICY "comercio_select" ON public.detalle_ordenes_compra FOR SELECT USING (EXISTS (SELECT 1 FROM public.ordenes_compra p WHERE p.id = detalle_ordenes_compra.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_ordenes_compra FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_compra p WHERE p.id = detalle_ordenes_compra.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_ordenes_compra FOR UPDATE USING (EXISTS (SELECT 1 FROM public.ordenes_compra p WHERE p.id = detalle_ordenes_compra.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_ordenes_compra FOR DELETE USING (EXISTS (SELECT 1 FROM public.ordenes_compra p WHERE p.id = detalle_ordenes_compra.orden_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_ventas_credito
CREATE POLICY "comercio_select" ON public.detalle_ventas_credito FOR SELECT USING (EXISTS (SELECT 1 FROM public.ventas_credito p WHERE p.id = detalle_ventas_credito.venta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_ventas_credito FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ventas_credito p WHERE p.id = detalle_ventas_credito.venta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_ventas_credito FOR DELETE USING (EXISTS (SELECT 1 FROM public.ventas_credito p WHERE p.id = detalle_ventas_credito.venta_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- detalle_domicilios
CREATE POLICY "comercio_select" ON public.detalle_domicilios FOR SELECT USING (EXISTS (SELECT 1 FROM public.domicilios p WHERE p.id = detalle_domicilios.domicilio_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_insert" ON public.detalle_domicilios FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.domicilios p WHERE p.id = detalle_domicilios.domicilio_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_update" ON public.detalle_domicilios FOR UPDATE USING (EXISTS (SELECT 1 FROM public.domicilios p WHERE p.id = detalle_domicilios.domicilio_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));
CREATE POLICY "comercio_delete" ON public.detalle_domicilios FOR DELETE USING (EXISTS (SELECT 1 FROM public.domicilios p WHERE p.id = detalle_domicilios.domicilio_id AND p.comercio_id = public.get_user_comercio_id(auth.uid())));

-- Update handle_new_user for invite flow
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_comercio_id UUID;
  invite_comercio_id UUID;
  v_invite_code TEXT;
BEGIN
  v_invite_code := NEW.raw_user_meta_data->>'invite_code';

  IF v_invite_code IS NOT NULL AND v_invite_code != '' THEN
    SELECT id INTO invite_comercio_id FROM public.comercios WHERE invite_code = v_invite_code;
  END IF;

  IF invite_comercio_id IS NOT NULL THEN
    -- Joining existing comercio via invite
    INSERT INTO public.profiles (user_id, email, is_approved, comercio_id)
    VALUES (NEW.id, NEW.email, true, invite_comercio_id);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    INSERT INTO public.comercio_miembros (comercio_id, user_id, rol) VALUES (invite_comercio_id, NEW.id, 'user');
  ELSE
    -- Creating new comercio (new business owner)
    INSERT INTO public.profiles (user_id, email, is_approved) VALUES (NEW.id, NEW.email, false);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    INSERT INTO public.comercios (owner_user_id, nombre)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'store_name', 'Mi Negocio'))
    RETURNING id INTO new_comercio_id;
    INSERT INTO public.comercio_miembros (comercio_id, user_id, rol) VALUES (new_comercio_id, NEW.id, 'owner');
    UPDATE public.profiles SET comercio_id = new_comercio_id WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
