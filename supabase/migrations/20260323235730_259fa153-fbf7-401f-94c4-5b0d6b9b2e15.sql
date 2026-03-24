
-- Add supplier fields to productos table
ALTER TABLE public.productos 
  ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS precio_compra_habitual NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_pedido_sugerida NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_productos_proveedor_id ON public.productos(proveedor_id);

-- Create ordenes_compra table
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'borrador',
  mensaje_generado TEXT,
  whatsapp_enviado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ordenes_compra"
  ON public.ordenes_compra FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ordenes_compra"
  ON public.ordenes_compra FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ordenes_compra"
  ON public.ordenes_compra FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ordenes_compra"
  ON public.ordenes_compra FOR DELETE USING (auth.uid() = user_id);

-- Create detalle_ordenes_compra table
CREATE TABLE IF NOT EXISTS public.detalle_ordenes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_producto TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'unidad',
  cantidad_solicitada NUMERIC NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.detalle_ordenes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own detalle_ordenes_compra"
  ON public.detalle_ordenes_compra FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = detalle_ordenes_compra.orden_id AND oc.user_id = auth.uid()));

CREATE POLICY "Users can insert their own detalle_ordenes_compra"
  ON public.detalle_ordenes_compra FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = detalle_ordenes_compra.orden_id AND oc.user_id = auth.uid()));

CREATE POLICY "Users can update their own detalle_ordenes_compra"
  ON public.detalle_ordenes_compra FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = detalle_ordenes_compra.orden_id AND oc.user_id = auth.uid()));

CREATE POLICY "Users can delete their own detalle_ordenes_compra"
  ON public.detalle_ordenes_compra FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = detalle_ordenes_compra.orden_id AND oc.user_id = auth.uid()));

-- Add whatsapp field to proveedores
ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add whatsapp config columns to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;

-- Trigger for updated_at on ordenes_compra
CREATE TRIGGER update_ordenes_compra_updated_at
  BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
