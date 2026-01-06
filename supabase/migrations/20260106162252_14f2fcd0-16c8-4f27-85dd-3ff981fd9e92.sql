-- Tabla de mesas del restaurante
CREATE TABLE public.mesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero_mesa INTEGER NOT NULL,
  nombre TEXT,
  capacidad INTEGER DEFAULT 4,
  pos_x NUMERIC DEFAULT 0,
  pos_y NUMERIC DEFAULT 0,
  ancho NUMERIC DEFAULT 80,
  alto NUMERIC DEFAULT 80,
  forma TEXT DEFAULT 'cuadrada',
  es_activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mesas" ON public.mesas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mesas" ON public.mesas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mesas" ON public.mesas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mesas" ON public.mesas FOR DELETE USING (auth.uid() = user_id);

-- Tabla de órdenes activas (cuentas abiertas)
CREATE TABLE public.ordenes_activas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE SET NULL,
  numero_orden INTEGER NOT NULL,
  nombre_cliente TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  estado TEXT DEFAULT 'abierta',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ordenes_activas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ordenes_activas" ON public.ordenes_activas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ordenes_activas" ON public.ordenes_activas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ordenes_activas" ON public.ordenes_activas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ordenes_activas" ON public.ordenes_activas FOR DELETE USING (auth.uid() = user_id);

-- Tabla de detalle de órdenes activas
CREATE TABLE public.detalle_ordenes_activas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_activas(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  nombre_item TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  notas TEXT
);

-- Enable RLS
ALTER TABLE public.detalle_ordenes_activas ENABLE ROW LEVEL SECURITY;

-- Policies based on parent order
CREATE POLICY "Users can view detalle of their ordenes_activas" ON public.detalle_ordenes_activas 
FOR SELECT USING (EXISTS (SELECT 1 FROM ordenes_activas WHERE ordenes_activas.id = detalle_ordenes_activas.orden_id AND ordenes_activas.user_id = auth.uid()));

CREATE POLICY "Users can insert detalle of their ordenes_activas" ON public.detalle_ordenes_activas 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM ordenes_activas WHERE ordenes_activas.id = detalle_ordenes_activas.orden_id AND ordenes_activas.user_id = auth.uid()));

CREATE POLICY "Users can update detalle of their ordenes_activas" ON public.detalle_ordenes_activas 
FOR UPDATE USING (EXISTS (SELECT 1 FROM ordenes_activas WHERE ordenes_activas.id = detalle_ordenes_activas.orden_id AND ordenes_activas.user_id = auth.uid()));

CREATE POLICY "Users can delete detalle of their ordenes_activas" ON public.detalle_ordenes_activas 
FOR DELETE USING (EXISTS (SELECT 1 FROM ordenes_activas WHERE ordenes_activas.id = detalle_ordenes_activas.orden_id AND ordenes_activas.user_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_mesas_updated_at BEFORE UPDATE ON public.mesas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordenes_activas_updated_at BEFORE UPDATE ON public.ordenes_activas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();