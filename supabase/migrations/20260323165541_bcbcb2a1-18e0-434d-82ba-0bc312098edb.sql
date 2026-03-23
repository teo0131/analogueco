
-- ══════════════════════════════════════════════════════
-- MÓDULO FINANZAS: Cuentas por Pagar, Cobrar, Recordatorios
-- ══════════════════════════════════════════════════════

-- Cuentas por Pagar (gastos fijos y variables)
CREATE TABLE IF NOT EXISTS public.cuentas_por_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Otros',
  monto NUMERIC NOT NULL DEFAULT 0,
  periodicidad TEXT NOT NULL DEFAULT 'mensual',
  dia_vencimiento INTEGER,
  fecha_vencimiento DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  proveedor TEXT,
  notas TEXT,
  es_recurrente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cuentas por Cobrar
CREATE TABLE IF NOT EXISTS public.cuentas_por_cobrar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_nombre TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recordatorios de pago
CREATE TABLE IF NOT EXISTS public.recordatorios_pago (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cuenta_id UUID,
  tipo TEXT NOT NULL DEFAULT 'pagar',
  titulo TEXT NOT NULL,
  descripcion TEXT,
  monto NUMERIC,
  fecha_recordatorio DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────
ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordatorios_pago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cxp_select" ON public.cuentas_por_pagar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cxp_insert" ON public.cuentas_por_pagar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cxp_update" ON public.cuentas_por_pagar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cxp_delete" ON public.cuentas_por_pagar FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "cxc_select" ON public.cuentas_por_cobrar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cxc_insert" ON public.cuentas_por_cobrar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cxc_update" ON public.cuentas_por_cobrar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cxc_delete" ON public.cuentas_por_cobrar FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "recordatorios_select" ON public.recordatorios_pago FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recordatorios_insert" ON public.recordatorios_pago FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recordatorios_update" ON public.recordatorios_pago FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recordatorios_delete" ON public.recordatorios_pago FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cuentas_por_pagar_updated_at
  BEFORE UPDATE ON public.cuentas_por_pagar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuentas_por_cobrar_updated_at
  BEFORE UPDATE ON public.cuentas_por_cobrar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
