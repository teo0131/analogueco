import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { menuItems, categories, MenuItem } from "@/data/menuItems";
import { MenuItemButton } from "@/components/MenuItemButton";
import { CurrentOrder } from "@/components/CurrentOrder";
import { OrderHistory, CompletedOrder } from "@/components/OrderHistory";
import { DeletedOrders } from "@/components/DeletedOrders";
import { OrderDetail } from "@/components/OrderDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Package, History, Building2, ChefHat, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import fraternoLogo from "@/assets/fraterno-brand.png";

const Index = () => {
  const navigate = useNavigate();
  const [currentItems, setCurrentItems] = useState<MenuItem[]>([]);
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState(1);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<CompletedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedOrderNumber = localStorage.getItem('orderNumber');
    const savedCompletedOrders = localStorage.getItem('completedOrders');
    const savedDeletedOrders = localStorage.getItem('deletedOrders');

    if (savedOrderNumber) setOrderNumber(parseInt(savedOrderNumber));
    if (savedCompletedOrders) {
      const orders = JSON.parse(savedCompletedOrders).map((order: CompletedOrder) => ({
        ...order,
        timestamp: new Date(order.timestamp)
      }));
      setCompletedOrders(orders);
    }
    if (savedDeletedOrders) {
      const orders = JSON.parse(savedDeletedOrders).map((order: CompletedOrder) => ({
        ...order,
        timestamp: new Date(order.timestamp)
      }));
      setDeletedOrders(orders);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('orderNumber', orderNumber.toString());
  }, [orderNumber]);

  useEffect(() => {
    localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
  }, [completedOrders]);

  useEffect(() => {
    localStorage.setItem('deletedOrders', JSON.stringify(deletedOrders));
  }, [deletedOrders]);

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
        // Check if this menu item corresponds to a prepared product with a recipe
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

        // If product has a recipe, deduct ingredients
        if (productos && productos.length > 0) {
          const producto = productos[0];
          const receta = producto.recetas;
          
          if (receta && typeof receta === 'object' && 'detalle_recetas' in receta) {
            for (const detalle of receta.detalle_recetas) {
              const insumo = detalle.insumo;
              const cantidadRequerida = detalle.cantidad_insumo_por_unidad;
              
              // Check if there's enough stock
              if (insumo.stock_actual < cantidadRequerida) {
                toast.error(
                  `Stock insuficiente de ${insumo.nombre} para preparar ${item.name}. ` +
                  `Requerido: ${cantidadRequerida} ${insumo.unidad_inventario}, ` +
                  `Disponible: ${insumo.stock_actual} ${insumo.unidad_inventario}`
                );
                return;
              }

              // Update stock
              const nuevoStock = insumo.stock_actual - cantidadRequerida;
              const { error: updateError } = await supabase
                .from("productos")
                .update({ stock_actual: nuevoStock })
                .eq("id", insumo.id);

              if (updateError) {
                console.error("Error updating stock:", updateError);
                toast.error(`Error al actualizar stock de ${insumo.nombre}`);
                return;
              }

              // Register inventory movement (consumo)
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
                console.error("Error registering movement:", movimientoError);
                toast.error(`Error al registrar movimiento de ${insumo.nombre}`);
                return;
              }
            }

            toast.success(`Insumos descontados para ${item.name}`);
          }
        }
      }

      // Complete the order
      const total = currentItems.reduce((sum, item) => sum + item.price, 0);
      const newOrder: CompletedOrder = {
        id: Date.now(),
        orderNumber,
        items: currentItems.map(item => ({ name: item.name, price: item.price })),
        total,
        comment,
        timestamp: new Date(),
      };

      setCompletedOrders([newOrder, ...completedOrders]);
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

  const handleDeleteOrder = (orderId: number) => {
    const orderToDelete = completedOrders.find(order => order.id === orderId);
    if (orderToDelete) {
      setCompletedOrders(completedOrders.filter(order => order.id !== orderId));
      setDeletedOrders([orderToDelete, ...deletedOrders]);
      toast.info(`Orden #${orderToDelete.orderNumber} eliminada`);
    }
  };

  const handleRestoreOrder = (orderId: number) => {
    const orderToRestore = deletedOrders.find(order => order.id === orderId);
    if (orderToRestore) {
      setDeletedOrders(deletedOrders.filter(order => order.id !== orderId));
      setCompletedOrders([orderToRestore, ...completedOrders]);
      toast.success(`Orden #${orderToRestore.orderNumber} restaurada`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={fraternoLogo} alt="Fraterno Café" className="h-16 w-auto" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">FRATERNO CAFÉ</h1>
                <p className="text-sm opacity-90">Sistema POS + Inventario</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate("/productos")}
              >
                <Package className="mr-2 h-4 w-4" />
                Productos
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate("/proveedores")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Proveedores
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate("/recetas")}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Recetas
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate("/inventario/ingreso")}
              >
                <Package className="mr-2 h-4 w-4" />
                Ingreso
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate("/inventario/historial")}
              >
                <History className="mr-2 h-4 w-4" />
                Kardex
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
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
                Órdenes Activas
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex-1">
                Órdenes Eliminadas
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
