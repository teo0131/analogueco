-- Create elementos_planta table for decorative/structural elements
CREATE TABLE public.elementos_planta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'pared', 'barra', 'cocina', 'bano', 'entrada', 'decorativo'
  nombre TEXT,
  pos_x NUMERIC DEFAULT 0,
  pos_y NUMERIC DEFAULT 0,
  ancho NUMERIC DEFAULT 100,
  alto NUMERIC DEFAULT 40,
  forma TEXT DEFAULT 'rectangular',
  color TEXT DEFAULT '#6b7280',
  rotacion NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.elementos_planta ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own elementos_planta"
ON public.elementos_planta
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own elementos_planta"
ON public.elementos_planta
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own elementos_planta"
ON public.elementos_planta
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own elementos_planta"
ON public.elementos_planta
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_elementos_planta_updated_at
BEFORE UPDATE ON public.elementos_planta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();