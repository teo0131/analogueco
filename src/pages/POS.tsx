import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemButton } from "@/components/MenuItemButton";
import { CurrentOrder } from "@/components/CurrentOrder";
import { OrderHistory, CompletedOrder } from "@/components/OrderHistory";
import { DeletedOrders } from "@/components/DeletedOrders";
import { OrderDetail } from "@/components/OrderDetail";
import { GenerarFactura } from "@/components/factura/GenerarFactura";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Menu, Store, Calculator, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MenuItemDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  es_activo: boolean;
  tipo_item: string;
  stock_actual: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url?: string;
  tipo_item: string;
  stock_actual: number;
}

const POS = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentItems, setCurrentItems] = useState<MenuItem[]>([]);
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState(1);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<CompletedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [storeNameInput, setStoreNameInput] = useState("");
  const [savingStoreName, setSavingStoreName] = useState(false);

  // Change calculator state
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState<number | null>(null);

  // Invoice state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<CompletedOrder | null>(null);

  // Load menu items and orders from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load user settings (store name)
        const { data: settingsData } = await supabase
          .from("user_settings")
          .select("store_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsData?.store_name) {
          setStoreName(settingsData.store_name);
        }

        // Load menu items
        const { data: menuData, error: menuError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("es_activo", true)
          .order("categoria")
          .order("orden_display");

        if (menuError) throw menuError;

        if (menuData && menuData.length > 0) {
          const items: MenuItem[] = menuData.map((item: MenuItemDB) => ({
            id: item.id,
            name: item.nombre,
            price: item.precio,
            description: item.descripcion || "",
            category: item.categoria || "Sin Categoría",
            image_url: (item as any).image_url || undefined,
            tipo_item: item.tipo_item || "retail",
            stock_actual: item.stock_actual || 0,
          }));
          setMenuItems(items);
          setCategories(Array.from(new Set(items.map(item => item.category))));
        }

        // Load completed orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("ordenes_pos")
          .select(`
            *,
            detalle_ordenes_pos (*)
          `)
          .eq("user_id", user.id)
          .order("fecha", { ascending: false });

        if (ordersError) throw ordersError;

        if (ordersData) {
          const orders: CompletedOrder[] = ordersData.map((order: any) => ({
            id: order.id,
            orderNumber: order.numero_orden,
            items: order.detalle_ordenes_pos.map((d: any) => ({
              name: d.nombre_item,
              price: d.precio_unitario,
            })),
            total: order.total,
            comment: order.comentario || "",
            timestamp: new Date(order.fecha),
          }));
          setCompletedOrders(orders);
          
          // Set next order number
          const maxOrder = Math.max(0, ...ordersData.map((o: any) => o.numero_orden));
          setOrderNumber(maxOrder + 1);
        }

        // Load deleted orders
        const { data: deletedData, error: deletedError } = await supabase
          .from("ordenes_eliminadas_pos")
          .select("*")
          .eq("user_id", user.id)
          .order("fecha_eliminacion", { ascending: false });

        if (deletedError) throw deletedError;

        if (deletedData) {
          const deleted: CompletedOrder[] = deletedData.map((order: any) => ({
            id: order.id,
            orderNumber: order.numero_orden,
            items: [],
            total: order.total,
            comment: order.comentario || "",
            timestamp: new Date(order.fecha_orden),
          }));
          setDeletedOrders(deleted);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const currentTotal = currentItems.reduce((sum, item) => sum + item.price, 0);

  const handleAddItem = (item: MenuItem) => {
    setCurrentItems([...currentItems, item]);
    toast.success(`${item.name} añadido a la orden`);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...currentItems];
    const removedItem = newItems.splice(index, 1)[0];
    setCurrentItems(newItems);
    toast.info(`${removedItem.name} removido de la orden`);
  };

  const handleCompleteOrder = async () => {
    if (currentItems.length === 0) {
      toast.error("Agrega items a la orden primero");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Process inventory deductions based on item type
      for (const item of currentItems) {
        if (item.tipo_item === 'retail') {
          // Para items tipo retail: reducir stock directamente del menu_item
          const { data: menuItemData, error: menuError } = await supabase
            .from("menu_items")
            .select("stock_actual")
            .eq("id", item.id)
            .single();

          if (menuError) {
            toast.error(`Error al verificar stock de ${item.name}`);
            return;
          }

          if (menuItemData.stock_actual < 1) {
            toast.error(`Stock insuficiente de ${item.name}`);
            return;
          }

          const nuevoStock = menuItemData.stock_actual - 1;
          const { error: updateError } = await supabase
            .from("menu_items")
            .update({ stock_actual: nuevoStock })
            .eq("id", item.id);

          if (updateError) {
            toast.error(`Error al actualizar stock de ${item.name}`);
            return;
          }
        } else if (item.tipo_item === 'receta') {
          // Para items tipo receta: buscar receta y reducir insumos
          const { data: recetaData } = await supabase
            .from("recetas")
            .select(`
              id,
              detalle_recetas (
                insumo_id,
                cantidad_insumo_por_unidad,
                insumo:productos!detalle_recetas_insumo_id_fkey (
                  id,
                  nombre,
                  stock_actual,
                  costo_promedio,
                  unidad_inventario
                )
              )
            `)
            .eq("menu_item_id", item.id)
            .maybeSingle();

          if (recetaData && recetaData.detalle_recetas) {
            for (const detalle of recetaData.detalle_recetas) {
              const insumo = detalle.insumo as any;
              const cantidadRequerida = detalle.cantidad_insumo_por_unidad;
              
              if (insumo.stock_actual < cantidadRequerida) {
                toast.error(
                  `Stock insuficiente de ${insumo.nombre} para preparar ${item.name}`
                );
                return;
              }

              const nuevoStock = insumo.stock_actual - cantidadRequerida;
              const { error: updateError } = await supabase
                .from("productos")
                .update({ stock_actual: nuevoStock })
                .eq("id", insumo.id);

              if (updateError) {
                toast.error(`Error al actualizar stock de ${insumo.nombre}`);
                return;
              }

              const { error: movimientoError } = await supabase
                .from("movimientos_inventario")
                .insert({
                  producto_id: insumo.id,
                  tipo_movimiento: "consumo",
                  cantidad: cantidadRequerida,
                  stock_resultante: nuevoStock,
                  costo_unitario_referencia: insumo.costo_promedio,
                  referencia: `Venta POS - Orden #${orderNumber}`,
                  notas: `Consumo para preparar: ${item.name}`,
                  user_id: user.id,
                });

              if (movimientoError) {
                toast.error(`Error al registrar movimiento de ${insumo.nombre}`);
                return;
              }
            }
          }
        }
      }

      // Save order to database
      const total = currentItems.reduce((sum, item) => sum + item.price, 0);
      
      const { data: newOrder, error: orderError } = await supabase
        .from("ordenes_pos")
        .insert({
          user_id: user.id,
          numero_orden: orderNumber,
          total,
          comentario: comment || null,
          fecha: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Save order details
      const detalles = currentItems.map(item => ({
        orden_id: newOrder.id,
        menu_item_id: item.id,
        nombre_item: item.name,
        precio_unitario: item.price,
        cantidad: 1,
        subtotal: item.price,
      }));

      const { error: detalleError } = await supabase
        .from("detalle_ordenes_pos")
        .insert(detalles);

      if (detalleError) throw detalleError;

      // Update local state
      const completedOrder: CompletedOrder = {
        id: newOrder.id,
        orderNumber,
        items: currentItems.map(item => ({ name: item.name, price: item.price })),
        total,
        comment,
        timestamp: new Date(),
      };

      setCompletedOrders([completedOrder, ...completedOrders]);
      setCurrentItems([]);
      setComment("");
      setOrderNumber(orderNumber + 1);
      setShowChangeCalculator(false);
      setPaymentAmount("");
      setChangeAmount(null);
      toast.success(`Orden #${orderNumber} completada con éxito`);
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Error al completar la orden");
    }
  };

  const handleSelectOrder = (order: CompletedOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleDeleteOrder = async (orderId: number | string) => {
    const orderToDelete = completedOrders.find(order => order.id === orderId);
    if (!orderToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to deleted orders table
      await supabase.from("ordenes_eliminadas_pos").insert({
        user_id: user.id,
        orden_original_id: typeof orderId === 'string' ? orderId : null,
        numero_orden: orderToDelete.orderNumber,
        total: orderToDelete.total,
        comentario: orderToDelete.comment,
        fecha_orden: orderToDelete.timestamp.toISOString(),
      });

      // Delete from main table
      await supabase.from("ordenes_pos").delete().eq("id", String(orderId));

      setCompletedOrders(completedOrders.filter(order => order.id !== orderId));
      setDeletedOrders([orderToDelete, ...deletedOrders]);
      toast.info(`Orden #${orderToDelete.orderNumber} eliminada`);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error al eliminar orden");
    }
  };

  const handleRestoreOrder = async (orderId: number | string) => {
    const orderToRestore = deletedOrders.find(order => order.id === orderId);
    if (!orderToRestore) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Re-insert into main orders table
      const { data: newOrder, error } = await supabase
        .from("ordenes_pos")
        .insert({
          user_id: user.id,
          numero_orden: orderToRestore.orderNumber,
          total: orderToRestore.total,
          comentario: orderToRestore.comment || null,
          fecha: orderToRestore.timestamp.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Delete from eliminated table
      await supabase.from("ordenes_eliminadas_pos").delete().eq("id", String(orderId));

      const restoredOrder = { ...orderToRestore, id: newOrder.id };
      setDeletedOrders(deletedOrders.filter(order => order.id !== orderId));
      setCompletedOrders([restoredOrder, ...completedOrders]);
      toast.success(`Orden #${orderToRestore.orderNumber} restaurada`);
    } catch (error) {
      console.error("Error restoring order:", error);
      toast.error("Error al restaurar orden");
    }
  };

  const handleExportToExcel = () => {
    const data = completedOrders.map(order => ({
      "Número Orden": order.orderNumber,
      "Fecha": order.timestamp.toLocaleString("es-CO"),
      "Items": order.items.map(i => i.name).join(", "),
      "Total": order.total,
      "Comentario": order.comment || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `ventas_${date}.xlsx`);
    toast.success("Reporte exportado a Excel");
  };

  const handleCalculateChange = () => {
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment < currentTotal) {
      toast.error("El monto debe ser mayor o igual al total");
      return;
    }
    setChangeAmount(payment - currentTotal);
  };

  const handleGenerateInvoice = (order: CompletedOrder) => {
    setInvoiceOrder({
      ...order,
      id: String(order.id),
    });
    setShowInvoiceModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {menuItems.length === 0 ? (
        <div className="text-center py-12 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">¡Bienvenido a tu POS!</h2>
          
          {!storeName && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <label className="block text-sm font-medium mb-2 text-left">
                <Store className="inline h-4 w-4 mr-1" />
                Nombre de tu comercio
              </label>
              <div className="flex gap-2">
                <Input
                  value={storeNameInput}
                  onChange={(e) => setStoreNameInput(e.target.value)}
                  placeholder="Ej: Mi Cafetería"
                  className="flex-1"
                />
                <Button 
                  onClick={async () => {
                    if (!storeNameInput.trim()) {
                      toast.error("Ingresa un nombre para tu comercio");
                      return;
                    }
                    setSavingStoreName(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      
                      const { error } = await supabase
                        .from("user_settings")
                        .upsert({
                          user_id: user.id,
                          store_name: storeNameInput.trim()
                        }, { onConflict: 'user_id' });
                      
                      if (error) throw error;
                      setStoreName(storeNameInput.trim());
                      toast.success("Nombre guardado");
                    } catch (error) {
                      toast.error("Error al guardar");
                    } finally {
                      setSavingStoreName(false);
                    }
                  }}
                  disabled={savingStoreName}
                >
                  {savingStoreName ? "..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
          
          {storeName && (
            <p className="text-lg font-medium text-primary mb-4">{storeName}</p>
          )}
          
          <p className="text-muted-foreground mb-6">
            Aún no tienes items en tu menú. Crea tu primer item para comenzar a vender.
          </p>
          <Button onClick={() => navigate("/menu")}>
            <Menu className="mr-2 h-4 w-4" />
            Configurar Mi Menú
          </Button>
        </div>
      ) : (
        <>
          {/* Export Button */}
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExportToExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <Tabs defaultValue={categories[0]} className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted p-2">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {menuItems
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <MenuItemButton
                            key={item.id}
                            item={item}
                            onAdd={handleAddItem}
                          />
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Current Order Section */}
            <div className="space-y-4">
              <CurrentOrder
                items={currentItems}
                comment={comment}
                onCommentChange={setComment}
                onRemoveItem={handleRemoveItem}
                onCompleteOrder={handleCompleteOrder}
                orderNumber={orderNumber}
              />

              {/* Change Calculator Button */}
              {currentItems.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowChangeCalculator(true)}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular Cambio
                </Button>
              )}
            </div>
          </div>

          {/* Order History Section */}
          <div className="mt-8">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="active" className="flex-1">
                  Órdenes Activas ({completedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="deleted" className="flex-1">
                  Eliminadas ({deletedOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4">
                <OrderHistory
                  orders={completedOrders}
                  onSelectOrder={handleSelectOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onGenerateInvoice={handleGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="deleted" className="mt-4">
                <DeletedOrders
                  orders={deletedOrders}
                  onSelectOrder={handleSelectOrder}
                  onRestoreOrder={handleRestoreOrder}
                />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Order Detail Dialog */}
      <OrderDetail
        order={selectedOrder}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Invoice Generation Modal */}
      {invoiceOrder && (
        <GenerarFactura
          orden={{
            id: String(invoiceOrder.id),
            orderNumber: invoiceOrder.orderNumber,
            items: invoiceOrder.items,
            total: invoiceOrder.total,
            comment: invoiceOrder.comment,
            timestamp: invoiceOrder.timestamp,
          }}
          open={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setInvoiceOrder(null);
          }}
        />
      )}

      {/* Change Calculator Dialog */}
      <Dialog open={showChangeCalculator} onOpenChange={setShowChangeCalculator}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcular Cambio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(currentTotal)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Monto recibido
              </label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setChangeAmount(null);
                }}
                placeholder="Ingresa el monto"
                className="text-lg"
              />
            </div>

            <Button onClick={handleCalculateChange} className="w-full">
              Calcular
            </Button>

            {changeAmount !== null && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Devuelta</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(changeAmount)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
