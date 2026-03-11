
-- Tabla para sesiones de caja (apertura/cierre)
CREATE TABLE public.sesiones_caja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  monto_apertura NUMERIC NOT NULL DEFAULT 0,
  monto_cierre NUMERIC,
  total_ventas NUMERIC,
  total_efectivo NUMERIC,
  total_tarjeta NUMERIC,
  total_otros NUMERIC,
  diferencia NUMERIC,
  notas_apertura TEXT,
  notas_cierre TEXT,
  abierta_por TEXT,
  cerrada_por TEXT,
  fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sesiones_caja"
  ON public.sesiones_caja FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sesiones_caja"
  ON public.sesiones_caja FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sesiones_caja"
  ON public.sesiones_caja FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sesiones_caja"
  ON public.sesiones_caja FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_sesiones_caja_updated_at
  BEFORE UPDATE ON public.sesiones_caja
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
