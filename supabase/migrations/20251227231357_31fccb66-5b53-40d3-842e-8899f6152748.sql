-- Agregar columna tipo_item a menu_items
-- 'retail' = el stock se reduce directamente del menu_item
-- 'receta' = el stock se reduce de los insumos según la receta
ALTER TABLE public.menu_items
ADD COLUMN tipo_item text NOT NULL DEFAULT 'retail'
CHECK (tipo_item IN ('retail', 'receta'));