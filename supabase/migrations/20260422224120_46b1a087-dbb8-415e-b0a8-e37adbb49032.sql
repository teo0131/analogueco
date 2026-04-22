-- Agregar campos para facturación empresa/persona y soporte DIAN
ALTER TABLE public.facturas_fisicas
  ADD COLUMN IF NOT EXISTS tipo_cliente text NOT NULL DEFAULT 'persona',
  ADD COLUMN IF NOT EXISTS iva_porcentaje numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cliente_email text,
  ADD COLUMN IF NOT EXISTS cliente_razon_social text,
  ADD COLUMN IF NOT EXISTS cliente_dv text;

-- Validación: tipo_cliente solo puede ser persona o empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'facturas_fisicas_tipo_cliente_check'
  ) THEN
    ALTER TABLE public.facturas_fisicas
      ADD CONSTRAINT facturas_fisicas_tipo_cliente_check
      CHECK (tipo_cliente IN ('persona', 'empresa'));
  END IF;
END$$;