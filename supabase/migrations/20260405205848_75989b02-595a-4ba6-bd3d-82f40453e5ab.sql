
CREATE TABLE public.calendario_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comercio_id UUID REFERENCES public.comercios(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  hora TIME,
  tipo TEXT NOT NULL DEFAULT 'otro',
  es_recurrente BOOLEAN NOT NULL DEFAULT false,
  periodicidad TEXT DEFAULT 'mensual',
  dia_recurrente INTEGER,
  color TEXT DEFAULT '#3b82f6',
  modulo_origen TEXT DEFAULT 'manual',
  referencia_id UUID,
  alerta_dias_antes INTEGER DEFAULT 1,
  completado BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comercio_select" ON public.calendario_eventos FOR SELECT USING (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_insert" ON public.calendario_eventos FOR INSERT WITH CHECK (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_update" ON public.calendario_eventos FOR UPDATE USING (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_delete" ON public.calendario_eventos FOR DELETE USING (comercio_id = get_user_comercio_id(auth.uid()));

CREATE TRIGGER set_comercio_id_calendario BEFORE INSERT ON public.calendario_eventos FOR EACH ROW EXECUTE FUNCTION public.set_comercio_id_from_user();
CREATE TRIGGER update_calendario_updated_at BEFORE UPDATE ON public.calendario_eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_calendario_comercio ON public.calendario_eventos(comercio_id);
CREATE INDEX idx_calendario_fecha ON public.calendario_eventos(fecha_inicio);
