
-- ============================================================
-- CUENTAS EN DEUDA (Ventas a crédito / Fiado)
-- ============================================================

-- 1. Clientes con cuenta abierta
CREATE TABLE public.clientes_cuenta (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  nombre        TEXT NOT NULL,
  telefono      TEXT,
  email         TEXT,
  notas         TEXT,
  saldo_total   NUMERIC NOT NULL DEFAULT 0,
  estado        TEXT NOT NULL DEFAULT 'activo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes_cuenta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select" ON public.clientes_cuenta FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clientes_insert" ON public.clientes_cuenta FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_update" ON public.clientes_cuenta FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clientes_delete" ON public.clientes_cuenta FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_clientes_cuenta_updated_at
  BEFORE UPDATE ON public.clientes_cuenta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Ventas a crédito (encabezado)
CREATE TABLE public.ventas_credito (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  cliente_id   UUID NOT NULL REFERENCES public.clientes_cuenta(id) ON DELETE CASCADE,
  total        NUMERIC NOT NULL DEFAULT 0,
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ventas_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_credito_select" ON public.ventas_credito FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ventas_credito_insert" ON public.ventas_credito FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ventas_credito_update" ON public.ventas_credito FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ventas_credito_delete" ON public.ventas_credito FOR DELETE USING (auth.uid() = user_id);

-- 3. Detalle de cada venta a crédito
CREATE TABLE public.detalle_ventas_credito (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id        UUID NOT NULL REFERENCES public.ventas_credito(id) ON DELETE CASCADE,
  nombre_item     TEXT NOT NULL,
  cantidad        NUMERIC NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  subtotal        NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.detalle_ventas_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalle_vc_select" ON public.detalle_ventas_credito FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ventas_credito vc
    WHERE vc.id = detalle_ventas_credito.venta_id AND vc.user_id = auth.uid()
  ));
CREATE POLICY "detalle_vc_insert" ON public.detalle_ventas_credito FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ventas_credito vc
    WHERE vc.id = detalle_ventas_credito.venta_id AND vc.user_id = auth.uid()
  ));
CREATE POLICY "detalle_vc_delete" ON public.detalle_ventas_credito FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ventas_credito vc
    WHERE vc.id = detalle_ventas_credito.venta_id AND vc.user_id = auth.uid()
  ));

-- 4. Pagos / abonos a una cuenta de cliente
CREATE TABLE public.pagos_cuenta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  cliente_id  UUID NOT NULL REFERENCES public.clientes_cuenta(id) ON DELETE CASCADE,
  monto       NUMERIC NOT NULL DEFAULT 0,
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos_cuenta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select" ON public.pagos_cuenta FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pagos_insert" ON public.pagos_cuenta FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pagos_update" ON public.pagos_cuenta FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pagos_delete" ON public.pagos_cuenta FOR DELETE USING (auth.uid() = user_id);

-- 5. Trigger: actualizar saldo_total del cliente automáticamente
CREATE OR REPLACE FUNCTION public.recalculate_saldo_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id UUID;
  v_ventas     NUMERIC;
  v_pagos      NUMERIC;
BEGIN
  IF TG_TABLE_NAME = 'ventas_credito' THEN
    v_cliente_id := COALESCE(NEW.cliente_id, OLD.cliente_id);
  ELSIF TG_TABLE_NAME = 'pagos_cuenta' THEN
    v_cliente_id := COALESCE(NEW.cliente_id, OLD.cliente_id);
  END IF;

  SELECT COALESCE(SUM(total), 0) INTO v_ventas
  FROM public.ventas_credito WHERE cliente_id = v_cliente_id;

  SELECT COALESCE(SUM(monto), 0) INTO v_pagos
  FROM public.pagos_cuenta WHERE cliente_id = v_cliente_id;

  UPDATE public.clientes_cuenta
  SET saldo_total = v_ventas - v_pagos, updated_at = now()
  WHERE id = v_cliente_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_saldo_on_venta
  AFTER INSERT OR UPDATE OR DELETE ON public.ventas_credito
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_saldo_cliente();

CREATE TRIGGER trg_saldo_on_pago
  AFTER INSERT OR UPDATE OR DELETE ON public.pagos_cuenta
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_saldo_cliente();

CREATE INDEX idx_ventas_credito_cliente ON public.ventas_credito(cliente_id);
CREATE INDEX idx_pagos_cuenta_cliente   ON public.pagos_cuenta(cliente_id);
