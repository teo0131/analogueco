import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Plus, Trash2, Save, Scan } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProveedorSelector } from "@/components/inventory/ProveedorSelector";
import { ProductSearch } from "@/components/inventory/ProductSearch";

interface ProductoEntrada {
  id: string;
  producto_id: string;
  producto_nombre: string;
  codigo_barra?: string;
  unidad: string;
  cantidad_empaque: number;
  unidades_por_empaque: number;
  cantidad_total: number;
  costo_unitario: number;
  costo_total: number;
}

const IngresoInventario = () => {
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState<string>("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [numeroFactura, setNumeroFactura] = useState("");
  const [notas, setNotas] = useState("");
  const [productos, setProductos] = useState<ProductoEntrada[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddProducto = (producto: any) => {
    const newProducto: ProductoEntrada = {
      id: crypto.randomUUID(),
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      codigo_barra: producto.codigo_barra,
      unidad: producto.unidad_inventario,
      cantidad_empaque: 1,
      unidades_por_empaque: 1,
      cantidad_total: 1,
      costo_unitario: 0,
      costo_total: 0,
    };
    setProductos([...productos, newProducto]);
  };

  const handleRemoveProducto = (id: string) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const handleUpdateProducto = (id: string, field: keyof ProductoEntrada, value: any) => {
    setProductos(productos.map(p => {
      if (p.id !== id) return p;
      
      const updated = { ...p, [field]: value };
      
      // Recalcular cantidad total y costo total
      if (field === 'cantidad_empaque' || field === 'unidades_por_empaque') {
        updated.cantidad_total = updated.cantidad_empaque * updated.unidades_por_empaque;
        updated.costo_total = updated.cantidad_total * updated.costo_unitario;
      } else if (field === 'costo_unitario') {
        updated.costo_total = updated.cantidad_total * updated.costo_unitario;
      }
      
      return updated;
    }));
  };

  const calcularTotalFactura = () => {
    return productos.reduce((sum, p) => sum + p.costo_total, 0);
  };

  const handleConfirmIngreso = async () => {
    if (!proveedor) {
      toast.error("Debes seleccionar un proveedor");
      return;
    }

    if (productos.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    // Validar que todos los productos tengan costo
    const productosSinCosto = productos.filter(p => p.costo_unitario <= 0);
    if (productosSinCosto.length > 0) {
      toast.error("Todos los productos deben tener un costo unitario mayor a 0");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleSaveIngreso = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // 1. Crear entrada de inventario
      const { data: entrada, error: entradaError } = await supabase
        .from('entradas_inventario')
        .insert({
          user_id: user.id,
          proveedor_id: proveedor,
          fecha_compra: format(fecha, 'yyyy-MM-dd'),
          numero_factura_proveedor: numeroFactura || null,
          valor_total_factura: calcularTotalFactura(),
          notas: notas || null
        })
        .select()
        .single();

      if (entradaError) throw entradaError;

      // 2. Crear detalles de entrada
      const detalles = productos.map(p => ({
        entrada_id: entrada.id,
        producto_id: p.producto_id,
        cantidad: p.cantidad_total,
        costo_unitario: p.costo_unitario,
        costo_total: p.costo_total,
        codigo_barra_ingresado: p.codigo_barra || null
      }));

      const { error: detallesError } = await supabase
        .from('detalle_entradas')
        .insert(detalles);

      if (detallesError) throw detallesError;

      // 3. Actualizar stock y costo promedio de cada producto
      for (const producto of productos) {
        // Obtener producto actual
        const { data: prodActual, error: prodError } = await supabase
          .from('productos')
          .select('stock_actual, costo_promedio')
          .eq('id', producto.producto_id)
          .single();

        if (prodError) throw prodError;

        // Calcular nuevo costo promedio ponderado
        const stockAnterior = Number(prodActual.stock_actual);
        const costoAnterior = Number(prodActual.costo_promedio);
        const cantidadNueva = producto.cantidad_total;
        const costoNuevo = producto.costo_unitario;

        const stockTotal = stockAnterior + cantidadNueva;
        const costoPromedio = stockTotal > 0 
          ? ((stockAnterior * costoAnterior) + (cantidadNueva * costoNuevo)) / stockTotal
          : costoNuevo;

        // Actualizar producto
        const { error: updateError } = await supabase
          .from('productos')
          .update({
            stock_actual: stockTotal,
            costo_promedio: costoPromedio
          })
          .eq('id', producto.producto_id);

        if (updateError) throw updateError;

        // 4. Crear movimiento de inventario
        const { error: movError } = await supabase
          .from('movimientos_inventario')
          .insert({
            user_id: user.id,
            producto_id: producto.producto_id,
            tipo_movimiento: 'entrada',
            referencia: `Compra #${entrada.id.slice(0, 8)}${numeroFactura ? ` - Factura: ${numeroFactura}` : ''}`,
            cantidad: cantidadNueva,
            stock_resultante: stockTotal,
            costo_unitario_referencia: costoNuevo,
            notas: `Entrada de inventario - Proveedor`
          });

        if (movError) throw movError;
      }

      toast.success("¡Inventario actualizado correctamente!");
      navigate("/");
    } catch (error: any) {
      console.error("Error al guardar ingreso:", error);
      toast.error(error.message || "Error al guardar el ingreso");
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Ingresar al Inventario</h1>
              <p className="text-muted-foreground">Registra compras a proveedores</p>
            </div>
          </div>
        </div>

        {/* Formulario Principal */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de la Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proveedor */}
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                <ProveedorSelector
                  value={proveedor}
                  onChange={setProveedor}
                />
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label>Fecha de Compra *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fecha && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(date) => date && setFecha(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Número de Factura */}
              <div className="space-y-2">
                <Label htmlFor="factura">Número de Factura</Label>
                <Input
                  id="factura"
                  placeholder="Ej: FAC-001234"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                />
              </div>

              {/* Total Calculado */}
              <div className="space-y-2">
                <Label>Total de la Factura (Calculado)</Label>
                <div className="text-2xl font-bold text-primary">
                  ${calcularTotalFactura().toLocaleString('es-CO')}
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                placeholder="Observaciones adicionales..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Productos de la Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda/Escaneo */}
            <ProductSearch onProductSelect={handleAddProducto} />

            {/* Tabla de Productos */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Producto</th>
                    <th className="text-left p-3 font-medium">Cant. Empaques</th>
                    <th className="text-left p-3 font-medium">Unid./Empaque</th>
                    <th className="text-left p-3 font-medium">Total Unidades</th>
                    <th className="text-left p-3 font-medium">Costo Unit.</th>
                    <th className="text-left p-3 font-medium">Total</th>
                    <th className="text-left p-3 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        No hay productos agregados. Busca o escanea un producto arriba.
                      </td>
                    </tr>
                  ) : (
                    productos.map((producto) => (
                      <tr key={producto.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{producto.producto_nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {producto.codigo_barra && `Código: ${producto.codigo_barra}`}
                            {' • '}
                            {producto.unidad}
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={producto.cantidad_empaque}
                            onChange={(e) => handleUpdateProducto(producto.id, 'cantidad_empaque', parseFloat(e.target.value) || 1)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={producto.unidades_por_empaque}
                            onChange={(e) => handleUpdateProducto(producto.id, 'unidades_por_empaque', parseFloat(e.target.value) || 1)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{producto.cantidad_total.toLocaleString('es-CO')}</div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={producto.costo_unitario || ''}
                            onChange={(e) => handleUpdateProducto(producto.id, 'costo_unitario', parseFloat(e.target.value) || 0)}
                            className="w-28"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">${producto.costo_total.toLocaleString('es-CO')}</div>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProducto(producto.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {productos.length > 0 && (
                  <tfoot className="bg-muted font-bold">
                    <tr>
                      <td colSpan={5} className="p-3 text-right">TOTAL:</td>
                      <td className="p-3 text-lg">${calcularTotalFactura().toLocaleString('es-CO')}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmIngreso}
                disabled={productos.length === 0 || !proveedor}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar y Actualizar Inventario
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ingreso al Inventario</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                <strong>Fecha:</strong> {format(fecha, "PPP", { locale: es })}
              </div>
              {numeroFactura && (
                <div>
                  <strong>Factura:</strong> {numeroFactura}
                </div>
              )}
              <div>
                <strong>Productos:</strong> {productos.length}
              </div>
              <div className="border-t pt-2 mt-2">
                <strong className="text-lg">Total: ${calcularTotalFactura().toLocaleString('es-CO')}</strong>
              </div>
              <div className="text-sm text-muted-foreground">
                Esta acción actualizará el stock y costo promedio de todos los productos.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveIngreso} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar Ingreso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IngresoInventario;
