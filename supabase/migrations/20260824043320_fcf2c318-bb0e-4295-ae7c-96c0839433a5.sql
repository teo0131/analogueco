CREATE OR REPLACE FUNCTION public.rentabilidad_por_producto(desde date, hasta date)
RETURNS TABLE (
  producto text,
  unidades bigint,
  venta numeric,
  costo_unitario numeric,
  costo_total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.nombre_item AS producto,
    SUM(d.cantidad)::bigint AS unidades,
    SUM(d.subtotal) AS venta,
    COALESCE(MAX(m.costo_unitario), 0) AS costo_unitario,
    SUM(d.cantidad * COALESCE(m.costo_unitario, 0)) AS costo_total
  FROM detalle_ordenes_pos d
  JOIN ordenes_pos o ON o.id = d.orden_id
  LEFT JOIN menu_items m ON m.id = d.menu_item_id
  WHERE o.comercio_id = get_user_comercio_id(auth.uid())
    AND (o.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN desde AND hasta
  GROUP BY d.nombre_item
  ORDER BY SUM(d.subtotal) DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.rentabilidad_por_producto(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rentabilidad_por_producto(date, date) TO authenticated;