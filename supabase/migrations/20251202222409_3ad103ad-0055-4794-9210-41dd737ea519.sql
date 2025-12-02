-- Crear tabla para items del menú personalizados por usuario
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT,
  es_activo BOOLEAN NOT NULL DEFAULT true,
  orden_display INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para órdenes del POS
CREATE TABLE public.ordenes_pos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero_orden INTEGER NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  comentario TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para detalle de órdenes
CREATE TABLE public.detalle_ordenes_pos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_pos(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  nombre_item TEXT NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL
);

-- Crear tabla para órdenes eliminadas
CREATE TABLE public.ordenes_eliminadas_pos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  orden_original_id UUID,
  numero_orden INTEGER NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  comentario TEXT,
  fecha_orden TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_eliminacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  motivo_eliminacion TEXT
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ordenes_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_eliminadas_pos ENABLE ROW LEVEL SECURITY;

-- Políticas para menu_items
CREATE POLICY "Users can view their own menu_items" ON public.menu_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own menu_items" ON public.menu_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own menu_items" ON public.menu_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own menu_items" ON public.menu_items FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ordenes_pos
CREATE POLICY "Users can view their own ordenes" ON public.ordenes_pos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ordenes" ON public.ordenes_pos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ordenes" ON public.ordenes_pos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ordenes" ON public.ordenes_pos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para detalle_ordenes_pos (basadas en la orden padre)
CREATE POLICY "Users can view detalle of their ordenes" ON public.detalle_ordenes_pos FOR SELECT 
USING (EXISTS (SELECT 1 FROM ordenes_pos WHERE ordenes_pos.id = detalle_ordenes_pos.orden_id AND ordenes_pos.user_id = auth.uid()));
CREATE POLICY "Users can insert detalle of their ordenes" ON public.detalle_ordenes_pos FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM ordenes_pos WHERE ordenes_pos.id = detalle_ordenes_pos.orden_id AND ordenes_pos.user_id = auth.uid()));
CREATE POLICY "Users can delete detalle of their ordenes" ON public.detalle_ordenes_pos FOR DELETE 
USING (EXISTS (SELECT 1 FROM ordenes_pos WHERE ordenes_pos.id = detalle_ordenes_pos.orden_id AND ordenes_pos.user_id = auth.uid()));

-- Políticas para ordenes_eliminadas_pos
CREATE POLICY "Users can view their own ordenes_eliminadas" ON public.ordenes_eliminadas_pos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ordenes_eliminadas" ON public.ordenes_eliminadas_pos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at en menu_items
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();