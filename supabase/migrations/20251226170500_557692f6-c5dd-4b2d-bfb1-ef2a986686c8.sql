-- Tabla para registrar gastos operativos (arriendo, servicios, nómina, etc.)
CREATE TABLE public.gastos_operativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  monto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gastos_operativos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own gastos"
ON public.gastos_operativos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gastos"
ON public.gastos_operativos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gastos"
ON public.gastos_operativos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gastos"
ON public.gastos_operativos FOR DELETE
USING (auth.uid() = user_id);