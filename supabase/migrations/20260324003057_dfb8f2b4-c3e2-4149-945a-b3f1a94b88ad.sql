
-- ============================================================
-- DOMICILIOS
-- ============================================================
CREATE TABLE public.domicilios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre_cliente TEXT NOT NULL,
  telefono_cliente TEXT,
  direccion_entrega TEXT NOT NULL,
  notas_cliente TEXT,
  canal TEXT NOT NULL DEFAULT 'manual',
  whatsapp_conversation_id TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  repartidor TEXT,
  tiempo_estimado_min INTEGER,
  total NUMERIC NOT NULL DEFAULT 0,
  metodo_pago TEXT DEFAULT 'efectivo',
  pagado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aprobado_at TIMESTAMP WITH TIME ZONE,
  entregado_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.detalle_domicilios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domicilio_id UUID NOT NULL REFERENCES public.domicilios(id) ON DELETE CASCADE,
  menu_item_id UUID,
  nombre_item TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  notas TEXT
);

ALTER TABLE public.domicilios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_domicilios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domicilios_select" ON public.domicilios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "domicilios_insert" ON public.domicilios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "domicilios_update" ON public.domicilios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "domicilios_delete" ON public.domicilios FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "detalle_domicilios_select" ON public.detalle_domicilios FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.domicilios d WHERE d.id = domicilio_id AND d.user_id = auth.uid()));
CREATE POLICY "detalle_domicilios_insert" ON public.detalle_domicilios FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.domicilios d WHERE d.id = domicilio_id AND d.user_id = auth.uid()));
CREATE POLICY "detalle_domicilios_update" ON public.detalle_domicilios FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.domicilios d WHERE d.id = domicilio_id AND d.user_id = auth.uid()));
CREATE POLICY "detalle_domicilios_delete" ON public.detalle_domicilios FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.domicilios d WHERE d.id = domicilio_id AND d.user_id = auth.uid()));

CREATE TRIGGER update_domicilios_updated_at
  BEFORE UPDATE ON public.domicilios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CRM CONTACTOS
-- ============================================================
CREATE TABLE public.crm_contactos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  canal_principal TEXT DEFAULT 'whatsapp',
  etiquetas TEXT[] DEFAULT '{}',
  notas TEXT,
  total_pedidos INTEGER NOT NULL DEFAULT 0,
  total_gastado NUMERIC NOT NULL DEFAULT 0,
  ultimo_contacto TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_contactos_select" ON public.crm_contactos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "crm_contactos_insert" ON public.crm_contactos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "crm_contactos_update" ON public.crm_contactos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "crm_contactos_delete" ON public.crm_contactos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crm_contactos_updated_at
  BEFORE UPDATE ON public.crm_contactos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CRM CONVERSACIONES
-- ============================================================
CREATE TABLE public.crm_conversaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contacto_id UUID REFERENCES public.crm_contactos(id) ON DELETE SET NULL,
  canal TEXT NOT NULL DEFAULT 'whatsapp',
  canal_referencia TEXT,
  estado TEXT NOT NULL DEFAULT 'abierto',
  asunto TEXT,
  nombre_cliente TEXT,
  telefono_cliente TEXT,
  total_mensajes INTEGER NOT NULL DEFAULT 0,
  ultimo_mensaje TEXT,
  ultimo_mensaje_at TIMESTAMP WITH TIME ZONE,
  domicilio_id UUID REFERENCES public.domicilios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- CRM MENSAJES
-- ============================================================
CREATE TABLE public.crm_mensajes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id UUID NOT NULL REFERENCES public.crm_conversaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente',
  canal TEXT NOT NULL DEFAULT 'whatsapp',
  contenido TEXT NOT NULL,
  tipo_contenido TEXT NOT NULL DEFAULT 'texto',
  media_url TEXT,
  wa_message_id TEXT,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_conv_select" ON public.crm_conversaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "crm_conv_insert" ON public.crm_conversaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "crm_conv_update" ON public.crm_conversaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "crm_conv_delete" ON public.crm_conversaciones FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "crm_mensajes_select" ON public.crm_mensajes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.crm_conversaciones c WHERE c.id = conversacion_id AND c.user_id = auth.uid()));
CREATE POLICY "crm_mensajes_insert" ON public.crm_mensajes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.crm_conversaciones c WHERE c.id = conversacion_id AND c.user_id = auth.uid()));
CREATE POLICY "crm_mensajes_update" ON public.crm_mensajes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.crm_conversaciones c WHERE c.id = conversacion_id AND c.user_id = auth.uid()));
CREATE POLICY "crm_mensajes_delete" ON public.crm_mensajes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.crm_conversaciones c WHERE c.id = conversacion_id AND c.user_id = auth.uid()));

CREATE TRIGGER update_crm_conversaciones_updated_at
  BEFORE UPDATE ON public.crm_conversaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_domicilios_user_estado ON public.domicilios(user_id, estado);
CREATE INDEX idx_crm_conv_user_estado ON public.crm_conversaciones(user_id, estado);
CREATE INDEX idx_crm_mensajes_conv ON public.crm_mensajes(conversacion_id, created_at);
CREATE INDEX idx_crm_contactos_telefono ON public.crm_contactos(user_id, telefono);
