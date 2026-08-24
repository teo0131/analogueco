CREATE TABLE public.gastos_fijos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  comercio_id uuid,
  concepto text NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'general',
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos_fijos TO authenticated;
GRANT ALL ON public.gastos_fijos TO service_role;

ALTER TABLE public.gastos_fijos ENABLE ROW LEVEL SECURITY;

CREATE POLICY comercio_select ON public.gastos_fijos FOR SELECT TO authenticated
  USING (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY comercio_insert ON public.gastos_fijos FOR INSERT TO authenticated
  WITH CHECK (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY comercio_update ON public.gastos_fijos FOR UPDATE TO authenticated
  USING (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY comercio_delete ON public.gastos_fijos FOR DELETE TO authenticated
  USING (comercio_id = get_user_comercio_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_gastos_fijos_comercio()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.comercio_id IS NULL THEN
    NEW.comercio_id := get_user_comercio_id(auth.uid());
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gastos_fijos_comercio
BEFORE INSERT OR UPDATE ON public.gastos_fijos
FOR EACH ROW EXECUTE FUNCTION public.set_gastos_fijos_comercio();