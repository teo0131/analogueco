import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Plus, Trash2, Save, Package, Coffee, ShoppingBag, Edit } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProveedorSelector } from "@/components/inventory/ProveedorSelector";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

interface MenuItem {
  id: string;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock_actual: number;
  costo_promedio: number;
  tipo_item: string;
}

interface Insumo {
  id: string;
  nombre: string;
  unidad_inventario: string;
  stock_actual: number;
  costo_promedio: number;
}

interface ProductoEntrada {
  id: string;
  item_id: string;
  nombre: string;
  categoria: string | null;
  unidad?: string;
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
  tipo: 'menu' | 'insumo';
}

const IngresoUnificado = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'menu' | 'insumos'>('menu');
  const [fecha, setFecha] = useState<Date>(new Date());
  const [notas, setNotas] = useState("");
  const [proveedorId, setProveedorId] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [productos, setProductos] = useState<ProductoEntrada[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para crear insumo rápido
  const [showCreateInsumoDialog, setShowCreateInsumoDialog] = useState(false);
  const [newInsumoData, setNewInsumoData] = useState({
    nombre: "",
    unidad_inventario: "unidad",
    stock_minimo: "0"
  });

  // Estado para eliminar insumo
  const [insumoToDelete, setInsumoToDelete] = useState<Insumo | null>(null);
  const [showDeletePinDialog, setShowDeletePinDialog] = useState(false);
  const [deletingInsumo, setDeletingInsumo] = useState(false);

  // Estado para ajustar stock
  const [showAdjustStockDialog, setShowAdjustStockDialog] = useState(false);
  const [showAdjustPinDialog, setShowAdjustPinDialog] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState<{ id: string; nombre: string; stock_actual: number; tipo: 'menu' | 'insumo'; unidad?: string } | null>(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch menu items (retail type)
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("id, nombre, categoria, precio, stock_actual, costo_promedio, tipo_item")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .eq("tipo_item", "retail")
        .order("categoria")
        .order("nombre");

      if (menuError) throw menuError;
      setMenuItems(menuData || []);

      // Fetch insumos
      const { data: insumosData, error: insumosError } = await supabase
        .from("productos")
        .select("id, nombre, unidad_inventario, stock_actual, costo_promedio")
        .eq("user_id", user.id)
        .eq("tipo_producto", "insumo")
        .eq("es_activo", true)
        .order("nombre");

      if (insumosError) throw insumosError;
      setInsumos(insumosData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = (item: MenuItem) => {
    if (productos.some(p => p.item_id === item.id && p.tipo === 'menu')) {
      toast.info("Este item ya está en la lista");
      return;
    }

    const newProducto: ProductoEntrada = {
      id: crypto.randomUUID(),
      item_id: item.id,
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: 1,
      costo_unitario: item.costo_promedio || 0,
      costo_total: item.costo_promedio || 0,
      tipo: 'menu'
    };
    setProductos([...productos, newProducto]);
    setSearchTerm("");
  };

  const handleAddInsumo = (insumo: Insumo) => {
    if (productos.some(p => p.item_id === insumo.id && p.tipo === 'insumo')) {
      toast.info("Este insumo ya está en la lista");
      return;
    }

    const newProducto: ProductoEntrada = {
      id: crypto.randomUUID(),
      item_id: insumo.id,
      nombre: insumo.nombre,
      categoria: null,
      unidad: insumo.unidad_inventario,
      cantidad: 1,
      costo_unitario: insumo.costo_promedio || 0,
      costo_total: insumo.costo_promedio || 0,
      tipo: 'insumo'
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

    const productosInvalidos = productos.filter(p => p.cantidad <= 0);
    if (productosInvalidos.length > 0) {
      toast.error("Todos los productos deben tener cantidad mayor a 0");
      return;
    }

    // Validar proveedor si hay insumos
    const tieneInsumos = productos.some(p => p.tipo === 'insumo');
    if (tieneInsumos && !proveedorId) {
      toast.error("Selecciona un proveedor para los insumos");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleSaveIngreso = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const productosMenu = productos.filter(p => p.tipo === 'menu');
      const productosInsumos = productos.filter(p => p.tipo === 'insumo');

      // Guardar entradas de menu items
      if (productosMenu.length > 0) {
        const { data: entradaMenu, error: entradaMenuError } = await supabase
          .from('entradas_menu')
          .insert({
            user_id: user.id,
            fecha: format(fecha, 'yyyy-MM-dd'),
            valor_total: productosMenu.reduce((sum, p) => sum + p.costo_total, 0),
            notas: notas || null
          })
          .select()
          .single();

        if (entradaMenuError) throw entradaMenuError;

        const detallesMenu = productosMenu.map(p => ({
          entrada_id: entradaMenu.id,
          menu_item_id: p.item_id,
          cantidad: p.cantidad,
          costo_unitario: p.costo_unitario,
          costo_total: p.costo_total
        }));

        const { error: detallesMenuError } = await supabase
          .from('detalle_entradas_menu')
          .insert(detallesMenu);

        if (detallesMenuError) throw detallesMenuError;

        // Actualizar stock y costo promedio de cada menu_item
        for (const producto of productosMenu) {
          const { data: itemActual, error: itemError } = await supabase
            .from('menu_items')
            .select('stock_actual, costo_promedio')
            .eq('id', producto.item_id)
            .single();

          if (itemError) throw itemError;

          const stockAnterior = Number(itemActual.stock_actual) || 0;
          const costoAnterior = Number(itemActual.costo_promedio) || 0;
          const cantidadNueva = producto.cantidad;
          const costoNuevo = producto.costo_unitario;

          const stockTotal = stockAnterior + cantidadNueva;
          const costoPromedio = stockTotal > 0 
            ? ((stockAnterior * costoAnterior) + (cantidadNueva * costoNuevo)) / stockTotal
            : costoNuevo;

          const { error: updateError } = await supabase
            .from('menu_items')
            .update({
              stock_actual: stockTotal,
              costo_promedio: costoPromedio,
              costo_unitario: costoNuevo
            })
            .eq('id', producto.item_id);

          if (updateError) throw updateError;
        }
      }

      // Guardar entradas de insumos
      if (productosInsumos.length > 0) {
        const { data: entradaInsumos, error: entradaInsumosError } = await supabase
          .from('entradas_inventario')
          .insert({
            user_id: user.id,
            proveedor_id: proveedorId,
            fecha_compra: format(fecha, 'yyyy-MM-dd'),
            valor_total_factura: productosInsumos.reduce((sum, p) => sum + p.costo_total, 0),
            notas: notas || null
          })
          .select()
          .single();

        if (entradaInsumosError) throw entradaInsumosError;

        const detallesInsumos = productosInsumos.map(p => ({
          entrada_id: entradaInsumos.id,
          producto_id: p.item_id,
          cantidad: p.cantidad,
          costo_unitario: p.costo_unitario,
          costo_total: p.costo_total
        }));

        const { error: detallesInsumosError } = await supabase
          .from('detalle_entradas')
          .insert(detallesInsumos);

        if (detallesInsumosError) throw detallesInsumosError;

        // Actualizar stock y costo promedio de cada insumo
        for (const producto of productosInsumos) {
          const { data: insumoActual, error: insumoError } = await supabase
            .from('productos')
            .select('stock_actual, costo_promedio')
            .eq('id', producto.item_id)
            .single();

          if (insumoError) throw insumoError;

          const stockAnterior = Number(insumoActual.stock_actual) || 0;
          const costoAnterior = Number(insumoActual.costo_promedio) || 0;
          const cantidadNueva = producto.cantidad;
          const costoNuevo = producto.costo_unitario;

          const stockTotal = stockAnterior + cantidadNueva;
          const costoPromedio = stockTotal > 0 
            ? ((stockAnterior * costoAnterior) + (cantidadNueva * costoNuevo)) / stockTotal
            : costoNuevo;

          const { error: updateError } = await supabase
            .from('productos')
            .update({
              stock_actual: stockTotal,
              costo_promedio: costoPromedio
            })
            .eq('id', producto.item_id);

          if (updateError) throw updateError;

          // Registrar movimiento de inventario
          const { error: movError } = await supabase
            .from('movimientos_inventario')
            .insert({
              user_id: user.id,
              producto_id: producto.item_id,
              tipo_movimiento: 'entrada',
              cantidad: cantidadNueva,
              stock_resultante: stockTotal,
              costo_unitario_referencia: costoNuevo,
              referencia: `Entrada de inventario`,
              notas: notas || null
            });

          if (movError) throw movError;
        }
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

  const handleCreateInsumo = async () => {
    if (!newInsumoData.nombre.trim()) {
      toast.error("El nombre del insumo es requerido");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from('productos')
        .insert({
          user_id: user.id,
          nombre: newInsumoData.nombre.trim(),
          unidad_inventario: newInsumoData.unidad_inventario,
          stock_minimo: parseFloat(newInsumoData.stock_minimo) || 0,
          tipo_producto: 'insumo',
          es_activo: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Insumo creado exitosamente");
      setShowCreateInsumoDialog(false);
      setNewInsumoData({ nombre: "", unidad_inventario: "unidad", stock_minimo: "0" });
      
      // Refresh insumos
      fetchData();
    } catch (error: any) {
      console.error("Error creating insumo:", error);
      toast.error(error.message || "Error al crear insumo");
    }
  };

  const handleDeleteInsumoClick = (insumo: Insumo, e: React.MouseEvent) => {
    e.stopPropagation();
    setInsumoToDelete(insumo);
    setShowDeletePinDialog(true);
  };

  // Funciones para ajuste de stock
  const handleAdjustStockClick = (item: { id: string; nombre: string; stock_actual: number; tipo: 'menu' | 'insumo'; unidad?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToAdjust(item);
    setNewStockValue(item.stock_actual.toString());
    setAdjustmentNote("");
    setShowAdjustStockDialog(true);
  };

  const handleConfirmAdjustStock = () => {
    if (!itemToAdjust) return;
    const newStock = parseFloat(newStockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Ingresa un valor de stock válido");
      return;
    }
    setShowAdjustStockDialog(false);
    setShowAdjustPinDialog(true);
  };

  const handleAdjustStockConfirm = async () => {
    if (!itemToAdjust) return;

    const newStock = parseFloat(newStockValue);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (itemToAdjust.tipo === 'insumo') {
        // Actualizar stock del insumo
        const { error: updateError } = await supabase
          .from('productos')
          .update({ stock_actual: newStock })
          .eq('id', itemToAdjust.id);

        if (updateError) throw updateError;

        // Registrar movimiento de ajuste
        const { error: movError } = await supabase
          .from('movimientos_inventario')
          .insert({
            user_id: user.id,
            producto_id: itemToAdjust.id,
            tipo_movimiento: 'ajuste',
            cantidad: newStock - itemToAdjust.stock_actual,
            stock_resultante: newStock,
            notas: adjustmentNote || `Ajuste manual de stock: ${itemToAdjust.stock_actual} → ${newStock}`
          });

        if (movError) throw movError;

        // Actualizar estado local
        setInsumos(insumos.map(i => 
          i.id === itemToAdjust.id ? { ...i, stock_actual: newStock } : i
        ));
      } else {
        // Actualizar stock del menu item
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ stock_actual: newStock })
          .eq('id', itemToAdjust.id);

        if (updateError) throw updateError;

        // Actualizar estado local
        setMenuItems(menuItems.map(i => 
          i.id === itemToAdjust.id ? { ...i, stock_actual: newStock } : i
        ));
      }

      toast.success("Stock ajustado correctamente");
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      toast.error(error.message || "Error al ajustar stock");
    } finally {
      setItemToAdjust(null);
      setNewStockValue("");
      setAdjustmentNote("");
    }
  };

  const handleDeleteInsumoConfirm = async () => {
    if (!insumoToDelete) return;

    setDeletingInsumo(true);
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', insumoToDelete.id);

      if (error) throw error;

      toast.success("Insumo eliminado");
      setInsumos(insumos.filter(i => i.id !== insumoToDelete.id));
      // También remover de productos si está agregado
      setProductos(productos.filter(p => !(p.item_id === insumoToDelete.id && p.tipo === 'insumo')));
    } catch (error: any) {
      console.error("Error deleting insumo:", error);
      toast.error(error.message || "Error al eliminar insumo");
    } finally {
      setDeletingInsumo(false);
      setInsumoToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filtrar items según tab activo
  const filteredMenuItems = menuItems.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInsumos = insumos.filter(insumo =>
    insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por categoría
  const categorizedMenuItems = filteredMenuItems.reduce((acc, item) => {
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
              <p className="text-muted-foreground">Registra entradas de productos e insumos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Selección de items */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'menu' | 'insumos')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="menu" className="gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Menú
                  </TabsTrigger>
                  <TabsTrigger value="insumos" className="gap-2">
                    <Coffee className="h-4 w-4" />
                    Insumos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={activeTab === 'menu' ? "Buscar item del menú..." : "Buscar insumo..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {activeTab === 'menu' ? (
                <div className="max-h-[400px] overflow-y-auto space-y-4">
                  {Object.entries(categorizedMenuItems).map(([categoria, items]) => (
                    <div key={categoria}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                        {categoria}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const yaAgregado = productos.some(p => p.item_id === item.id && p.tipo === 'menu');
                          return (
                            <div key={item.id} className="flex items-center gap-1">
                              <Button
                                variant={yaAgregado ? "secondary" : "outline"}
                                size="sm"
                                className="flex-1 justify-between text-left"
                                onClick={() => handleAddMenuItem(item)}
                                disabled={yaAgregado}
                              >
                                <span className="truncate">{item.nombre}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  Stock: {item.stock_actual}
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={(e) => handleAdjustStockClick({ 
                                  id: item.id, 
                                  nombre: item.nombre, 
                                  stock_actual: item.stock_actual, 
                                  tipo: 'menu' 
                                }, e)}
                                title="Ajustar stock"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {Object.keys(categorizedMenuItems).length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No hay items de tipo retail en el menú
                    </p>
                  )}
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredInsumos.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <Coffee className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm">
                        No hay insumos registrados
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => setShowCreateInsumoDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Insumo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowCreateInsumoDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Insumo
                        </Button>
                      </div>
                      {filteredInsumos.map((insumo) => {
                        const yaAgregado = productos.some(p => p.item_id === insumo.id && p.tipo === 'insumo');
                        return (
                          <div key={insumo.id} className="flex items-center gap-1">
                            <Button
                              variant={yaAgregado ? "secondary" : "outline"}
                              size="sm"
                              className="flex-1 justify-between text-left"
                              onClick={() => handleAddInsumo(insumo)}
                              disabled={yaAgregado}
                            >
                              <span className="truncate">{insumo.nombre}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {insumo.stock_actual} {insumo.unidad_inventario}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={(e) => handleAdjustStockClick({ 
                                id: insumo.id, 
                                nombre: insumo.nombre, 
                                stock_actual: insumo.stock_actual, 
                                tipo: 'insumo',
                                unidad: insumo.unidad_inventario 
                              }, e)}
                              title="Ajustar stock"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteInsumoClick(insumo, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
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

                {/* Proveedor (solo si hay insumos) */}
                {productos.some(p => p.tipo === 'insumo') && (
                  <div className="space-y-2">
                    <Label>Proveedor (requerido para insumos) *</Label>
                    <ProveedorSelector
                      value={proveedorId}
                      onChange={setProveedorId}
                    />
                  </div>
                )}

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
                        <th className="text-left p-3 font-medium">Tipo</th>
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
                          <td colSpan={6} className="text-center p-8 text-muted-foreground">
                            Selecciona items del menú o insumos para agregarlos
                          </td>
                        </tr>
                      ) : (
                        productos.map((producto) => (
                          <tr key={producto.id} className="border-t">
                            <td className="p-3">
                              {producto.tipo === 'menu' ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  <ShoppingBag className="h-3 w-3" />
                                  Menú
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                  <Coffee className="h-3 w-3" />
                                  Insumo
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{producto.nombre}</div>
                              {producto.unidad && (
                                <div className="text-sm text-muted-foreground">
                                  {producto.unidad}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
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
                          <td colSpan={4} className="p-3 text-right">TOTAL:</td>
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
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmIngreso}
                    disabled={saving || productos.length === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Ingreso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Confirmación */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Ingreso de Inventario</AlertDialogTitle>
              <AlertDialogDescription>
                Se registrará la entrada de {productos.length} producto(s) por un valor total de {formatPrice(calcularTotalFactura())}.
                <br /><br />
                Esta acción actualizará el stock y el costo promedio de los productos.
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

        {/* Dialog para crear insumo rápido */}
        <Dialog open={showCreateInsumoDialog} onOpenChange={setShowCreateInsumoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Insumo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="insumo-nombre">Nombre *</Label>
                <Input
                  id="insumo-nombre"
                  placeholder="Ej: Café molido, Leche, Azúcar..."
                  value={newInsumoData.nombre}
                  onChange={(e) => setNewInsumoData({...newInsumoData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insumo-unidad">Unidad de Inventario</Label>
                <Select
                  value={newInsumoData.unidad_inventario}
                  onValueChange={(v) => setNewInsumoData({...newInsumoData, unidad_inventario: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                    <SelectItem value="g">Gramos (g)</SelectItem>
                    <SelectItem value="lb">Libra (lb)</SelectItem>
                    <SelectItem value="lt">Litros (lt)</SelectItem>
                    <SelectItem value="ml">Mililitros (ml)</SelectItem>
                    <SelectItem value="oz">Onzas (oz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insumo-stock-minimo">Stock Mínimo</Label>
                <Input
                  id="insumo-stock-minimo"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newInsumoData.stock_minimo}
                  onChange={(e) => setNewInsumoData({...newInsumoData, stock_minimo: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateInsumoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateInsumo}>
                Crear Insumo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PIN Verification Dialog para eliminar insumo */}
        <PinVerificationDialog
          open={showDeletePinDialog}
          onOpenChange={(open) => {
            setShowDeletePinDialog(open);
            if (!open) setInsumoToDelete(null);
          }}
          onSuccess={handleDeleteInsumoConfirm}
          title="Eliminar Insumo"
          description={`¿Estás seguro de eliminar "${insumoToDelete?.nombre}"? Ingresa tu PIN de seguridad.`}
        />

        {/* Dialog para ajustar stock */}
        <Dialog open={showAdjustStockDialog} onOpenChange={setShowAdjustStockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Stock</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground">
                Producto: <span className="font-medium text-foreground">{itemToAdjust?.nombre}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Stock actual: <span className="font-medium text-foreground">{itemToAdjust?.stock_actual} {itemToAdjust?.unidad || 'unidades'}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-stock">Nuevo Stock *</Label>
                <Input
                  id="new-stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  placeholder="Ingresa el stock real"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment-note">Nota del ajuste (opcional)</Label>
                <Textarea
                  id="adjustment-note"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="Ej: Conteo físico, merma, etc."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdjustStockDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmAdjustStock}>
                Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PIN Verification Dialog para ajustar stock */}
        <PinVerificationDialog
          open={showAdjustPinDialog}
          onOpenChange={(open) => {
            setShowAdjustPinDialog(open);
            if (!open) {
              setItemToAdjust(null);
              setNewStockValue("");
              setAdjustmentNote("");
            }
          }}
          onSuccess={handleAdjustStockConfirm}
          title="Confirmar Ajuste de Stock"
          description={`Ingresa tu PIN para ajustar el stock de "${itemToAdjust?.nombre}" de ${itemToAdjust?.stock_actual} a ${newStockValue}.`}
        />
      </div>
    </div>
  );
};

export default IngresoUnificado;
