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
import { CalendarIcon, ArrowLeft, Plus, Trash2, Save, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock_actual: number;
  costo_promedio: number;
}

interface ProductoEntrada {
  id: string;
  menu_item_id: string;
  nombre: string;
  categoria: string | null;
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
}

const IngresoMenuInventario = () => {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState<Date>(new Date());
  const [notas, setNotas] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [productos, setProductos] = useState<ProductoEntrada[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("menu_items")
        .select("id, nombre, categoria, precio, stock_actual, costo_promedio")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .order("categoria")
        .order("nombre");

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error al cargar el menú");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProducto = (item: MenuItem) => {
    // Verificar si ya está agregado
    if (productos.some(p => p.menu_item_id === item.id)) {
      toast.info("Este item ya está en la lista");
      return;
    }

    const newProducto: ProductoEntrada = {
      id: crypto.randomUUID(),
      menu_item_id: item.id,
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: 1,
      costo_unitario: item.costo_promedio || 0,
      costo_total: item.costo_promedio || 0,
    };
    setProductos([...productos, newProducto]);
    setSearchTerm("");
  };

  const handleRemoveProducto = (id: string) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const handleUpdateProducto = (id: string, field: keyof ProductoEntrada, value: number) => {
    setProductos(productos.map(p => {
      if (p.id !== id) return p;
      
      const updated = { ...p, [field]: value };
      
      // Recalcular costo total
      if (field === 'cantidad' || field === 'costo_unitario') {
        updated.costo_total = updated.cantidad * updated.costo_unitario;
      }
      
      return updated;
    }));
  };

  const calcularTotalFactura = () => {
    return productos.reduce((sum, p) => sum + p.costo_total, 0);
  };

  const handleConfirmIngreso = async () => {
    if (productos.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    // Validar que todos tengan cantidad > 0
    const productosInvalidos = productos.filter(p => p.cantidad <= 0);
    if (productosInvalidos.length > 0) {
      toast.error("Todos los productos deben tener cantidad mayor a 0");
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
        .from('entradas_menu')
        .insert({
          user_id: user.id,
          fecha: format(fecha, 'yyyy-MM-dd'),
          valor_total: calcularTotalFactura(),
          notas: notas || null
        })
        .select()
        .single();

      if (entradaError) throw entradaError;

      // 2. Crear detalles de entrada
      const detalles = productos.map(p => ({
        entrada_id: entrada.id,
        menu_item_id: p.menu_item_id,
        cantidad: p.cantidad,
        costo_unitario: p.costo_unitario,
        costo_total: p.costo_total
      }));

      const { error: detallesError } = await supabase
        .from('detalle_entradas_menu')
        .insert(detalles);

      if (detallesError) throw detallesError;

      // 3. Actualizar stock y costo promedio de cada menu_item
      for (const producto of productos) {
        // Obtener item actual
        const { data: itemActual, error: itemError } = await supabase
          .from('menu_items')
          .select('stock_actual, costo_promedio')
          .eq('id', producto.menu_item_id)
          .single();

        if (itemError) throw itemError;

        // Calcular nuevo costo promedio ponderado
        const stockAnterior = Number(itemActual.stock_actual) || 0;
        const costoAnterior = Number(itemActual.costo_promedio) || 0;
        const cantidadNueva = producto.cantidad;
        const costoNuevo = producto.costo_unitario;

        const stockTotal = stockAnterior + cantidadNueva;
        const costoPromedio = stockTotal > 0 
          ? ((stockAnterior * costoAnterior) + (cantidadNueva * costoNuevo)) / stockTotal
          : costoNuevo;

        // Actualizar menu_item
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            stock_actual: stockTotal,
            costo_promedio: costoPromedio,
            costo_unitario: costoNuevo // Actualizar costo unitario con el último ingreso
          })
          .eq('id', producto.menu_item_id);

        if (updateError) throw updateError;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filtrar items del menú
  const filteredMenuItems = menuItems.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por categoría
  const categorizedItems = filteredMenuItems.reduce((acc, item) => {
    const cat = item.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold">Ingreso de Inventario</h1>
              <p className="text-muted-foreground">Registra entradas de productos del menú</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Selección de items del menú */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items del Menú
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {Object.entries(categorizedItems).map(([categoria, items]) => (
                  <div key={categoria}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      {categoria}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const yaAgregado = productos.some(p => p.menu_item_id === item.id);
                        return (
                          <Button
                            key={item.id}
                            variant={yaAgregado ? "secondary" : "outline"}
                            size="sm"
                            className="w-full justify-between text-left"
                            onClick={() => handleAddProducto(item)}
                            disabled={yaAgregado}
                          >
                            <span className="truncate">{item.nombre}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Stock: {item.stock_actual}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(categorizedItems).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No se encontraron items
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel derecho: Formulario y tabla de productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info de entrada */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Entrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
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

                  {/* Total Calculado */}
                  <div className="space-y-2">
                    <Label>Total de la Entrada</Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(calcularTotalFactura())}
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Textarea
                    id="notas"
                    placeholder="Observaciones adicionales..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabla de productos agregados */}
            <Card>
              <CardHeader>
                <CardTitle>Productos a Ingresar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Producto</th>
                        <th className="text-left p-3 font-medium">Cantidad</th>
                        <th className="text-left p-3 font-medium">Costo Unit.</th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-muted-foreground">
                            Selecciona items del menú para agregarlos
                          </td>
                        </tr>
                      ) : (
                        productos.map((producto) => (
                          <tr key={producto.id} className="border-t">
                            <td className="p-3">
                              <div className="font-medium">{producto.nombre}</div>
                              {producto.categoria && (
                                <div className="text-sm text-muted-foreground">
                                  {producto.categoria}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={producto.cantidad}
                                onChange={(e) => handleUpdateProducto(producto.id, 'cantidad', parseFloat(e.target.value) || 1)}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                step="100"
                                placeholder="0"
                                value={producto.costo_unitario || ''}
                                onChange={(e) => handleUpdateProducto(producto.id, 'costo_unitario', parseFloat(e.target.value) || 0)}
                                className="w-28"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-semibold">{formatPrice(producto.costo_total)}</div>
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
                          <td colSpan={3} className="p-3 text-right">TOTAL:</td>
                          <td className="p-3 text-lg">{formatPrice(calcularTotalFactura())}</td>
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
                    disabled={productos.length === 0}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Guardar Ingreso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <div>
                <strong>Productos:</strong> {productos.length}
              </div>
              <div className="border-t pt-2 mt-2">
                <strong className="text-lg">Total: {formatPrice(calcularTotalFactura())}</strong>
              </div>
              <div className="text-sm text-muted-foreground">
                Esta acción actualizará el stock y costo promedio de los items.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveIngreso} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IngresoMenuInventario;