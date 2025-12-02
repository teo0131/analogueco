import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemButton } from "@/components/MenuItemButton";
import { CurrentOrder } from "@/components/CurrentOrder";
import { OrderHistory, CompletedOrder } from "@/components/OrderHistory";
import { DeletedOrders } from "@/components/DeletedOrders";
import { OrderDetail } from "@/components/OrderDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Package, History, Building2, ChefHat, BarChart3, Menu, FileDown, Settings, Box, Store } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface MenuItemDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  es_activo: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

const Index = () => {
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
  const [userName, setUserName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeNameInput, setStoreNameInput] = useState("");
  const [savingStoreName, setSavingStoreName] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  // Load menu items and orders from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserName(user.email?.split("@")[0] || "Usuario");

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

      // Process inventory deductions for prepared products
      for (const item of currentItems) {
        const { data: productos } = await supabase
          .from("productos")
          .select(`
            id,
            nombre,
            tipo_producto,
            stock_actual,
            recetas!recetas_producto_final_id_fkey (
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
            )
          `)
          .eq("nombre", item.name)
          .eq("tipo_producto", "preparado")
          .eq("user_id", user.id);

        if (productos && productos.length > 0) {
          const producto = productos[0];
          const receta = producto.recetas;
          
          if (receta && typeof receta === 'object' && 'detalle_recetas' in receta) {
            for (const detalle of receta.detalle_recetas) {
              const insumo = detalle.insumo;
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
            toast.success(`Insumos descontados para ${item.name}`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-primary-foreground rounded-lg flex items-center justify-center">
                <Box className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{storeName || "AnalogueCo"}</h1>
                <p className="text-sm opacity-90">Hola, {userName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate("/menu")}>
                <Menu className="mr-2 h-4 w-4" />
                Mi Menú
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/productos")}>
                <Package className="mr-2 h-4 w-4" />
                Productos
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/proveedores")}>
                <Building2 className="mr-2 h-4 w-4" />
                Proveedores
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/recetas")}>
                <ChefHat className="mr-2 h-4 w-4" />
                Recetas
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/inventario/ingreso")}>
                <Package className="mr-2 h-4 w-4" />
                Ingreso
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/inventario/historial")}>
                <History className="mr-2 h-4 w-4" />
                Kardex
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportToExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <CurrentOrder
                  items={currentItems}
                  comment={comment}
                  onCommentChange={setComment}
                  onRemoveItem={handleRemoveItem}
                  onCompleteOrder={handleCompleteOrder}
                  orderNumber={orderNumber}
                />
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
      </div>

      {/* Order Detail Dialog */}
      <OrderDetail
        order={selectedOrder}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default Index;
