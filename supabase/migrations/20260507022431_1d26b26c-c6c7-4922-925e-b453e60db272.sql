
CREATE TABLE IF NOT EXISTS public.eventos_fisicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comercio_id uuid REFERENCES public.comercios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL,
  zona text,
  confianza numeric,
  metadata jsonb,
  fuente text
);

CREATE TABLE IF NOT EXISTS public.inconsistencias_pos_real (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comercio_id uuid REFERENCES public.comercios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL,
  evento_fisico_id uuid REFERENCES public.eventos_fisicos(id) ON DELETE SET NULL,
  orden_pos_id uuid REFERENCES public.ordenes_pos(id) ON DELETE SET NULL,
  descripcion text,
  monto_estimado numeric,
  estado text NOT NULL DEFAULT 'pendiente',
  resuelto_at timestamptz,
  notas text,
  severidad text NOT NULL DEFAULT 'media'
);

ALTER TABLE public.eventos_fisicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inconsistencias_pos_real ENABLE ROW LEVEL SECURITY;

-- eventos_fisicos policies
CREATE POLICY "comercio_select" ON public.eventos_fisicos
  FOR SELECT USING (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_insert" ON public.eventos_fisicos
  FOR INSERT WITH CHECK (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_update" ON public.eventos_fisicos
  FOR UPDATE USING (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_delete" ON public.eventos_fisicos
  FOR DELETE USING (comercio_id = public.get_user_comercio_id(auth.uid()));

-- inconsistencias_pos_real policies
CREATE POLICY "comercio_select" ON public.inconsistencias_pos_real
  FOR SELECT USING (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_insert" ON public.inconsistencias_pos_real
  FOR INSERT WITH CHECK (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_update" ON public.inconsistencias_pos_real
  FOR UPDATE USING (comercio_id = public.get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_delete" ON public.inconsistencias_pos_real
  FOR DELETE USING (comercio_id = public.get_user_comercio_id(auth.uid()));

-- Auto-fill comercio_id from user
CREATE TRIGGER set_comercio_id_eventos_fisicos
  BEFORE INSERT ON public.eventos_fisicos
  FOR EACH ROW EXECUTE FUNCTION public.set_comercio_id_from_user();

CREATE TRIGGER set_comercio_id_inconsistencias
  BEFORE INSERT ON public.inconsistencias_pos_real
  FOR EACH ROW EXECUTE FUNCTION public.set_comercio_id_from_user();

-- Realtime
ALTER TABLE public.eventos_fisicos REPLICA IDENTITY FULL;
ALTER TABLE public.inconsistencias_pos_real REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos_fisicos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inconsistencias_pos_real;

CREATE INDEX IF NOT EXISTS idx_eventos_fisicos_comercio ON public.eventos_fisicos(comercio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_comercio ON public.inconsistencias_pos_real(comercio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_estado ON public.inconsistencias_pos_real(comercio_id, estado);
