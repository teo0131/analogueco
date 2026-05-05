
CREATE TABLE public.carta_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id uuid NOT NULL UNIQUE,
  titulo text NOT NULL DEFAULT 'Carta',
  subtitulo text DEFAULT '',
  leyenda_pie text DEFAULT '',
  mostrar_logo boolean NOT NULL DEFAULT true,
  logo_url text,
  color_fondo text NOT NULL DEFAULT '#FFFFFF',
  color_texto text NOT NULL DEFAULT '#0B0B0B',
  color_acento text NOT NULL DEFAULT '#1E5EFF',
  color_categorias text NOT NULL DEFAULT '#0B0B0B',
  fuente_titulos text NOT NULL DEFAULT 'Space Grotesk',
  fuente_cuerpo text NOT NULL DEFAULT 'Inter',
  estilo text NOT NULL DEFAULT 'minimal',
  mostrar_descripcion boolean NOT NULL DEFAULT true,
  mostrar_precio_decimales boolean NOT NULL DEFAULT false,
  simbolo_moneda text NOT NULL DEFAULT '$',
  orden_categorias jsonb NOT NULL DEFAULT '[]'::jsonb,
  categorias_ocultas jsonb NOT NULL DEFAULT '[]'::jsonb,
  items_ocultos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carta_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comercio_select" ON public.carta_config FOR SELECT USING (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_insert" ON public.carta_config FOR INSERT WITH CHECK (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_update" ON public.carta_config FOR UPDATE USING (comercio_id = get_user_comercio_id(auth.uid()));
CREATE POLICY "comercio_delete" ON public.carta_config FOR DELETE USING (comercio_id = get_user_comercio_id(auth.uid()));

CREATE TRIGGER trg_carta_config_updated_at BEFORE UPDATE ON public.carta_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
