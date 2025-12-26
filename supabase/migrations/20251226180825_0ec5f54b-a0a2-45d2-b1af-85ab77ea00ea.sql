-- Agregar campos de inventario a menu_items para unificar menú e inventario
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS stock_actual numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS costo_unitario numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS costo_promedio numeric NOT NULL DEFAULT 0;

-- Crear tabla para registrar entradas de inventario basadas en menu_items
CREATE TABLE IF NOT EXISTS public.entradas_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de detalle de entradas por menu_item
CREATE TABLE IF NOT EXISTS public.detalle_entradas_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entrada_id UUID NOT NULL REFERENCES public.entradas_menu(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  costo_unitario NUMERIC NOT NULL DEFAULT 0,
  costo_total NUMERIC NOT NULL DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.entradas_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_entradas_menu ENABLE ROW LEVEL SECURITY;

-- Políticas para entradas_menu
CREATE POLICY "Users can view their own entradas_menu" 
ON public.entradas_menu FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entradas_menu" 
ON public.entradas_menu FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entradas_menu" 
ON public.entradas_menu FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entradas_menu" 
ON public.entradas_menu FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para detalle_entradas_menu
CREATE POLICY "Users can view detalle of their entradas_menu" 
ON public.detalle_entradas_menu FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.entradas_menu 
  WHERE entradas_menu.id = detalle_entradas_menu.entrada_id 
  AND entradas_menu.user_id = auth.uid()
));

CREATE POLICY "Users can insert detalle of their entradas_menu" 
ON public.detalle_entradas_menu FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.entradas_menu 
  WHERE entradas_menu.id = detalle_entradas_menu.entrada_id 
  AND entradas_menu.user_id = auth.uid()
));

CREATE POLICY "Users can update detalle of their entradas_menu" 
ON public.detalle_entradas_menu FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.entradas_menu 
  WHERE entradas_menu.id = detalle_entradas_menu.entrada_id 
  AND entradas_menu.user_id = auth.uid()
));

CREATE POLICY "Users can delete detalle of their entradas_menu" 
ON public.detalle_entradas_menu FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.entradas_menu 
  WHERE entradas_menu.id = detalle_entradas_menu.entrada_id 
  AND entradas_menu.user_id = auth.uid()
));