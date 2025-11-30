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
import { LogOut } from "lucide-react";
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

  const handleCompleteOrder = () => {
    if (currentItems.length === 0) {
      toast.error("Agrega items a la orden primero");
      return;
    }

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
    toast.success(`Orden #${orderNumber} completada`);
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
