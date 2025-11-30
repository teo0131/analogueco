-- =====================================================
-- SISTEMA DE INVENTARIO - FRATERNO CAFÉ
-- Base de datos completa con autenticación
-- =====================================================

-- Enums para tipos
CREATE TYPE public.tipo_producto AS ENUM ('retail', 'preparado');
CREATE TYPE public.tipo_movimiento AS ENUM ('entrada', 'salida_venta', 'ajuste', 'consumo');

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  codigo_interno TEXT,
  codigo_barra TEXT,
  categoria TEXT,
  tipo_producto tipo_producto NOT NULL DEFAULT 'retail',
  unidad_inventario TEXT NOT NULL DEFAULT 'unidad',
  stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo_promedio DECIMAL(10,2) NOT NULL DEFAULT 0,
  es_activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_productos_user_id ON public.productos(user_id);
CREATE INDEX idx_productos_codigo_barra ON public.productos(codigo_barra);
CREATE INDEX idx_productos_tipo ON public.productos(tipo_producto);

-- RLS para productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own productos"
  ON public.productos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own productos"
  ON public.productos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productos"
  ON public.productos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productos"
  ON public.productos FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: proveedores
-- =====================================================
CREATE TABLE public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  documento TEXT,
  contacto TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proveedores_user_id ON public.proveedores(user_id);

-- RLS para proveedores
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proveedores"
  ON public.proveedores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proveedores"
  ON public.proveedores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proveedores"
  ON public.proveedores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proveedores"
  ON public.proveedores FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: entradas_inventario (Compras)
-- =====================================================
CREATE TABLE public.entradas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_factura_proveedor TEXT,
  valor_total_factura DECIMAL(10,2),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entradas_user_id ON public.entradas_inventario(user_id);
CREATE INDEX idx_entradas_proveedor ON public.entradas_inventario(proveedor_id);
CREATE INDEX idx_entradas_fecha ON public.entradas_inventario(fecha_compra);

-- RLS para entradas_inventario
ALTER TABLE public.entradas_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entradas"
  ON public.entradas_inventario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entradas"
  ON public.entradas_inventario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entradas"
  ON public.entradas_inventario FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entradas"
  ON public.entradas_inventario FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: detalle_entradas
-- =====================================================
CREATE TABLE public.detalle_entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES public.entradas_inventario(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(10,2) NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  costo_total DECIMAL(10,2) NOT NULL,
  codigo_barra_ingresado TEXT
);

CREATE INDEX idx_detalle_entradas_entrada ON public.detalle_entradas(entrada_id);
CREATE INDEX idx_detalle_entradas_producto ON public.detalle_entradas(producto_id);

-- RLS para detalle_entradas (hereda permisos de entrada_inventario)
ALTER TABLE public.detalle_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view detalle of their entradas"
  ON public.detalle_entradas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.entradas_inventario 
      WHERE id = detalle_entradas.entrada_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert detalle of their entradas"
  ON public.detalle_entradas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entradas_inventario 
      WHERE id = detalle_entradas.entrada_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update detalle of their entradas"
  ON public.detalle_entradas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.entradas_inventario 
      WHERE id = detalle_entradas.entrada_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete detalle of their entradas"
  ON public.detalle_entradas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.entradas_inventario 
      WHERE id = detalle_entradas.entrada_id 
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLA: movimientos_inventario (Kardex)
-- =====================================================
CREATE TABLE public.movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  tipo_movimiento tipo_movimiento NOT NULL,
  referencia TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  cantidad DECIMAL(10,2) NOT NULL,
  stock_resultante DECIMAL(10,2) NOT NULL,
  costo_unitario_referencia DECIMAL(10,2),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimientos_user_id ON public.movimientos_inventario(user_id);
CREATE INDEX idx_movimientos_producto ON public.movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_tipo ON public.movimientos_inventario(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON public.movimientos_inventario(fecha);

-- RLS para movimientos_inventario
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own movimientos"
  ON public.movimientos_inventario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movimientos"
  ON public.movimientos_inventario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No permitimos UPDATE ni DELETE de movimientos (integridad del kardex)

-- =====================================================
-- TABLA: recetas
-- =====================================================
CREATE TABLE public.recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_final_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(producto_final_id)
);

CREATE INDEX idx_recetas_user_id ON public.recetas(user_id);
CREATE INDEX idx_recetas_producto ON public.recetas(producto_final_id);

-- RLS para recetas
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recetas"
  ON public.recetas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recetas"
  ON public.recetas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recetas"
  ON public.recetas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recetas"
  ON public.recetas FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: detalle_recetas
-- =====================================================
CREATE TABLE public.detalle_recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id UUID NOT NULL REFERENCES public.recetas(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  cantidad_insumo_por_unidad DECIMAL(10,4) NOT NULL,
  UNIQUE(receta_id, insumo_id)
);

CREATE INDEX idx_detalle_recetas_receta ON public.detalle_recetas(receta_id);
CREATE INDEX idx_detalle_recetas_insumo ON public.detalle_recetas(insumo_id);

-- RLS para detalle_recetas (hereda permisos de recetas)
ALTER TABLE public.detalle_recetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view detalle of their recetas"
  ON public.detalle_recetas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recetas 
      WHERE id = detalle_recetas.receta_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert detalle of their recetas"
  ON public.detalle_recetas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recetas 
      WHERE id = detalle_recetas.receta_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update detalle of their recetas"
  ON public.detalle_recetas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recetas 
      WHERE id = detalle_recetas.receta_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete detalle of their recetas"
  ON public.detalle_recetas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recetas 
      WHERE id = detalle_recetas.receta_id 
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para productos
CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();