import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, Clock, DollarSign, Check, Trash2, Edit, MapPin, ShoppingCart, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Mesa {
  id: string;
  numero_mesa: number;
  nombre: string | null;
}

interface DetalleOrden {
  id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas: string | null;
  menu_item_id: string | null;
}

interface OrdenActiva {
  id: string;
  numero_orden: number;
  nombre_cliente: string | null;
  total: number;
  estado: string;
  created_at: string;
  mesa_id: string | null;
  mesa?: Mesa;
  detalles: DetalleOrden[];
}

interface MenuItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: string | null;
  es_activo: boolean;
}

const OrdenesActivas = () => {
  const [ordenes, setOrdenes] = useState<OrdenActiva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrden, setSelectedOrden] = useState<OrdenActiva | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOrderDialog, setNewOrderDialog] = useState(false);
  const [addItemDialog, setAddItemDialog] = useState(false);

  const [newOrderData, setNewOrderData] = useState({
    mesa_id: "",
    nombre_cliente: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [ordenesRes, mesasRes, menuRes] = await Promise.all([
      supabase
        .from("ordenes_activas")
        .select(`
          *,
          mesa:mesas(id, numero_mesa, nombre)
        `)
        .eq("user_id", user.id)
        .eq("estado", "abierta")
        .order("created_at", { ascending: false }),
      supabase
        .from("mesas")
        .select("id, numero_mesa, nombre")
        .eq("user_id", user.id)
        .eq("es_activa", true)
        .order("numero_mesa"),
      supabase
        .from("menu_items")
        .select("id, nombre, precio, categoria, es_activo")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .order("nombre")
    ]);

    if (ordenesRes.error) {
      toast.error("Error al cargar órdenes");
      return;
    }

    // Fetch detalles for each orden
    const ordenesConDetalles = await Promise.all(
      (ordenesRes.data || []).map(async (orden) => {
        const { data: detalles } = await supabase
          .from("detalle_ordenes_activas")
          .select("*")
          .eq("orden_id", orden.id);
        return {
          ...orden,
          detalles: detalles || []
        };
      })
    );

    setOrdenes(ordenesConDetalles);
    setMesas(mesasRes.data || []);
    setMenuItems(menuRes.data || []);
    setLoading(false);
  };

  const handleCreateOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get next order number
    const { data: lastOrder } = await supabase
      .from("ordenes_activas")
      .select("numero_orden")
      .eq("user_id", user.id)
      .order("numero_orden", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastOrder?.numero_orden || 0) + 1;

    const { data, error } = await supabase.from("ordenes_activas").insert({
      user_id: user.id,
      numero_orden: nextNumber,
      mesa_id: newOrderData.mesa_id || null,
      nombre_cliente: newOrderData.nombre_cliente || null,
      total: 0,
      estado: "abierta"
    }).select().single();

    if (error) {
      toast.error("Error al crear orden");
      return;
    }

    toast.success(`Orden #${nextNumber} creada`);
    setNewOrderDialog(false);
    setNewOrderData({ mesa_id: "", nombre_cliente: "" });
    fetchData();
  };

  const handleAssignMesa = async (ordenId: string, mesaId: string | null) => {
    const { error } = await supabase
      .from("ordenes_activas")
      .update({ mesa_id: mesaId })
      .eq("id", ordenId);

    if (error) {
      toast.error("Error al asignar mesa");
      return;
    }

    toast.success("Mesa asignada");
    fetchData();
  };

  const handleAddItem = async (ordenId: string, item: MenuItem, cantidad: number = 1) => {
    const subtotal = item.precio * cantidad;

    const { error } = await supabase.from("detalle_ordenes_activas").insert({
      orden_id: ordenId,
      menu_item_id: item.id,
      nombre_item: item.nombre,
      cantidad,
      precio_unitario: item.precio,
      subtotal
    });

    if (error) {
      toast.error("Error al agregar item");
      return;
    }

    // Update total
    const orden = ordenes.find(o => o.id === ordenId);
    if (orden) {
      const newTotal = orden.total + subtotal;
      await supabase.from("ordenes_activas").update({ total: newTotal }).eq("id", ordenId);
    }

    toast.success(`${item.nombre} agregado`);
    setAddItemDialog(false);
    fetchData();
  };

  const handleRemoveItem = async (detalleId: string, ordenId: string, subtotal: number) => {
    const { error } = await supabase.from("detalle_ordenes_activas").delete().eq("id", detalleId);

    if (error) {
      toast.error("Error al eliminar item");
      return;
    }

    // Update total
    const orden = ordenes.find(o => o.id === ordenId);
    if (orden) {
      const newTotal = Math.max(0, orden.total - subtotal);
      await supabase.from("ordenes_activas").update({ total: newTotal }).eq("id", ordenId);
    }

    fetchData();
  };

  const handleCloseOrder = async (orden: OrdenActiva) => {
    // This will move the order to ordenes_pos (completed orders)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get next order number for ordenes_pos
    const { data: lastCompleted } = await supabase
      .from("ordenes_pos")
      .select("numero_orden")
      .eq("user_id", user.id)
      .order("numero_orden", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastCompleted?.numero_orden || 0) + 1;

    // Create completed order
    const { data: newOrden, error: ordenError } = await supabase.from("ordenes_pos").insert({
      user_id: user.id,
      numero_orden: nextNumber,
      total: orden.total,
      comentario: orden.nombre_cliente ? `Cliente: ${orden.nombre_cliente}` : null
    }).select().single();

    if (ordenError || !newOrden) {
      toast.error("Error al cerrar orden");
      return;
    }

    // Copy details
    for (const detalle of orden.detalles) {
      await supabase.from("detalle_ordenes_pos").insert({
        orden_id: newOrden.id,
        menu_item_id: detalle.menu_item_id || null,
        nombre_item: detalle.nombre_item,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal
      });
    }

    // Delete active order (cascade will delete details)
    await supabase.from("ordenes_activas").delete().eq("id", orden.id);

    toast.success(`Orden #${orden.numero_orden} cerrada y pasada a historial`);
    setDialogOpen(false);
    setSelectedOrden(null);
    fetchData();
  };

  const handleDeleteOrder = async (ordenId: string) => {
    const { error } = await supabase.from("ordenes_activas").delete().eq("id", ordenId);
    
    if (error) {
      toast.error("Error al eliminar orden");
      return;
    }

    toast.success("Orden eliminada");
    setDialogOpen(false);
    setSelectedOrden(null);
    fetchData();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
  };

  const getMesaLabel = (mesa: Mesa | undefined) => {
    if (!mesa) return "Sin mesa";
    return `Mesa #${mesa.numero_mesa}${mesa.nombre ? ` (${mesa.nombre})` : ""}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Órdenes Activas</h1>
          <p className="text-muted-foreground">Gestiona las cuentas abiertas del restaurante</p>
        </div>
        <div className="flex gap-2">
          <Link to="/mesas">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Mesas
            </Button>
          </Link>
          <Button onClick={() => setNewOrderDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      </div>

      {ordenes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay órdenes activas</h3>
            <p className="text-muted-foreground mb-4">Crea una nueva orden para empezar</p>
            <Button onClick={() => setNewOrderDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordenes.map((orden) => (
            <Card 
              key={orden.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => { setSelectedOrden(orden); setDialogOpen(true); }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Orden #{orden.numero_orden}</CardTitle>
                    {orden.nombre_cliente && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {orden.nombre_cliente}
                      </p>
                    )}
                  </div>
                  <Badge variant={orden.mesa ? "default" : "secondary"}>
                    <MapPin className="w-3 h-3 mr-1" />
                    {getMesaLabel(orden.mesa)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(orden.created_at), "HH:mm", { locale: es })}
                  </div>
                  <div className="text-sm">
                    {orden.detalles.length} items
                  </div>
                  <div className="text-xl font-bold flex items-center gap-1 text-primary">
                    <DollarSign className="w-5 h-5" />
                    {formatPrice(orden.total)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrden && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle>Orden #{selectedOrden.numero_orden}</DialogTitle>
                    {selectedOrden.nombre_cliente && (
                      <p className="text-muted-foreground">{selectedOrden.nombre_cliente}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {format(new Date(selectedOrden.created_at), "dd/MM HH:mm", { locale: es })}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Mesa assignment */}
                <div className="flex items-center gap-4">
                  <Label className="min-w-20">Mesa:</Label>
                  <Select 
                    value={selectedOrden.mesa_id || "none"} 
                    onValueChange={(v) => handleAssignMesa(selectedOrden.id, v === "none" ? null : v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin mesa asignada</SelectItem>
                      {mesas.map((mesa) => (
                        <SelectItem key={mesa.id} value={mesa.id}>
                          Mesa #{mesa.numero_mesa} {mesa.nombre && `(${mesa.nombre})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items list */}
                <div className="border rounded-lg">
                  <div className="p-3 border-b bg-muted/50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Items ({selectedOrden.detalles.length})</span>
                      <Button size="sm" variant="outline" onClick={() => setAddItemDialog(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                  <div className="divide-y max-h-60 overflow-y-auto">
                    {selectedOrden.detalles.map((detalle) => (
                      <div key={detalle.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{detalle.nombre_item}</p>
                          <p className="text-sm text-muted-foreground">
                            {detalle.cantidad} x {formatPrice(detalle.precio_unitario)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatPrice(detalle.subtotal)}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(detalle.id, selectedOrden.id, detalle.subtotal)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {selectedOrden.detalles.length === 0 && (
                      <div className="p-6 text-center text-muted-foreground">
                        No hay items en esta orden
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center text-xl font-bold p-4 bg-muted rounded-lg">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrden.total)}</span>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteOrder(selectedOrden.id)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Orden
                </Button>
                <Button 
                  onClick={() => handleCloseOrder(selectedOrden)}
                  className="w-full sm:w-auto"
                  disabled={selectedOrden.detalles.length === 0}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Cerrar Cuenta
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={newOrderDialog} onOpenChange={setNewOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Orden</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mesa (opcional)</Label>
              <Select value={newOrderData.mesa_id} onValueChange={(v) => setNewOrderData({ ...newOrderData, mesa_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin mesa asignada</SelectItem>
                  {mesas.map((mesa) => (
                    <SelectItem key={mesa.id} value={mesa.id}>
                      Mesa #{mesa.numero_mesa} {mesa.nombre && `(${mesa.nombre})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre del cliente (opcional)</Label>
              <Input
                value={newOrderData.nombre_cliente}
                onChange={(e) => setNewOrderData({ ...newOrderData, nombre_cliente: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOrderDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateOrder}>Crear Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialog} onOpenChange={setAddItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Item</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {menuItems.map((item) => (
              <div 
                key={item.id}
                className="p-3 border rounded-lg flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => selectedOrden && handleAddItem(selectedOrden.id, item)}
              >
                <div>
                  <p className="font-medium">{item.nombre}</p>
                  {item.categoria && <p className="text-sm text-muted-foreground">{item.categoria}</p>}
                </div>
                <span className="font-medium text-primary">{formatPrice(item.precio)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdenesActivas;
