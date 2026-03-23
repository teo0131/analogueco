-- ═══════════════════════════════════════════════════════════════════
-- MÓDULO RRHH: empleados, asistencia, nóminas, documentos
-- ═══════════════════════════════════════════════════════════════════

-- 1. EMPLEADOS
CREATE TABLE public.empleados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  nombre            TEXT NOT NULL,
  apellido          TEXT NOT NULL,
  cedula            TEXT,
  email             TEXT,
  telefono          TEXT,
  cargo             TEXT,
  departamento      TEXT,
  fecha_ingreso     DATE,
  tipo_contrato     TEXT DEFAULT 'indefinido',
  salario_base      NUMERIC DEFAULT 0,
  tipo_pago         TEXT DEFAULT 'mensual',
  valor_hora        NUMERIC DEFAULT 0,
  estado            TEXT DEFAULT 'activo',
  foto_url          TEXT,
  direccion         TEXT,
  fecha_nacimiento  DATE,
  eps               TEXT,
  arl               TEXT,
  cuenta_bancaria   TEXT,
  banco             TEXT,
  tipo_cuenta       TEXT,
  emergencia_nombre TEXT,
  emergencia_tel    TEXT,
  notas             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empleados_select"  ON public.empleados FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "empleados_insert"  ON public.empleados FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "empleados_update"  ON public.empleados FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "empleados_delete"  ON public.empleados FOR DELETE  USING (auth.uid() = user_id);

CREATE TRIGGER update_empleados_updated_at
  BEFORE UPDATE ON public.empleados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. REGISTROS DE ASISTENCIA (clock-in / clock-out)
CREATE TABLE public.registros_asistencia (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  empleado_id  UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL CHECK (tipo IN ('entrada','salida')),
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now(),
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registros_asistencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asistencia_select" ON public.registros_asistencia FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "asistencia_insert" ON public.registros_asistencia FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "asistencia_update" ON public.registros_asistencia FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "asistencia_delete" ON public.registros_asistencia FOR DELETE  USING (auth.uid() = user_id);


-- 3. NÓMINAS
CREATE TABLE public.nominas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  empleado_id      UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  periodo_inicio   DATE NOT NULL,
  periodo_fin      DATE NOT NULL,
  horas_trabajadas NUMERIC DEFAULT 0,
  salario_base     NUMERIC DEFAULT 0,
  valor_hora       NUMERIC DEFAULT 0,
  total_devengado  NUMERIC DEFAULT 0,
  deducciones      NUMERIC DEFAULT 0,
  total_pagar      NUMERIC DEFAULT 0,
  estado           TEXT DEFAULT 'pendiente',
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nominas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nominas_select" ON public.nominas FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "nominas_insert" ON public.nominas FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nominas_update" ON public.nominas FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "nominas_delete" ON public.nominas FOR DELETE  USING (auth.uid() = user_id);

CREATE TRIGGER update_nominas_updated_at
  BEFORE UPDATE ON public.nominas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 4. DOCUMENTOS DE EMPLEADOS
CREATE TABLE public.documentos_empleados (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  empleado_id  UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  tipo         TEXT DEFAULT 'otro',
  archivo_url  TEXT,
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_empleados_select" ON public.documentos_empleados FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "docs_empleados_insert" ON public.documentos_empleados FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "docs_empleados_update" ON public.documentos_empleados FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "docs_empleados_delete" ON public.documentos_empleados FOR DELETE  USING (auth.uid() = user_id);


-- 5. STORAGE BUCKET para documentos de empleados
INSERT INTO storage.buckets (id, name, public)
VALUES ('empleados-docs', 'empleados-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "empleados_docs_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'empleados-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "empleados_docs_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empleados-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "empleados_docs_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empleados-docs' AND auth.uid()::text = (storage.foldername(name))[1]);