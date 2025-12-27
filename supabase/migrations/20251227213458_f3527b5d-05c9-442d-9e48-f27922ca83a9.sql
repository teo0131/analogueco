-- Add 'insumo' to tipo_producto enum if not exists
ALTER TYPE tipo_producto ADD VALUE IF NOT EXISTS 'insumo';

-- Add menu_item_id to recetas table to link recipes directly to menu items
ALTER TABLE public.recetas 
ADD COLUMN menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE;

-- Make producto_final_id nullable since we now can use menu_item_id instead
ALTER TABLE public.recetas 
ALTER COLUMN producto_final_id DROP NOT NULL;

-- Add check constraint to ensure at least one reference exists
ALTER TABLE public.recetas 
ADD CONSTRAINT recetas_must_have_reference 
CHECK (producto_final_id IS NOT NULL OR menu_item_id IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_recetas_menu_item_id ON public.recetas(menu_item_id);

-- Update detalle_recetas foreign key to allow 'insumo' type products
-- (No change needed, it already references productos table)