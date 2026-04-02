
ALTER TABLE public.clientes_cuenta
ADD COLUMN tipo_cuenta text NOT NULL DEFAULT 'cliente';

COMMENT ON COLUMN public.clientes_cuenta.tipo_cuenta IS 'cliente = cuenta de deuda real, consumo_interno = cuenta neutra para empleados/dueños';
