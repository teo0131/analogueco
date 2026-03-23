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
import { Plus, Users, Clock, DollarSign, Trash2, MapPin, Settings, ChevronRight, Edit2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

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
  name: string;
  price: number;
  description: string;
  category: string;
  tipo_item: string;
  stock_actual: number;
}

// Props interface is defined inside the component file below

interface ActiveOrdersPanelProps {
  menuItems: MenuItem[];
  onSelectActiveOrder: (orden: OrdenActiva | null) => void;
  selectedActiveOrder: OrdenActiva | null;
  onRefresh?: () => void;
  refreshKey?: number;
}

export const ActiveOrdersPanel = ({ 
  menuItems, 
  onSelectActiveOrder, 
  selectedActiveOrder,
  onRefresh,
  refreshKey = 0
}: ActiveOrdersPanelProps) => {
  const [ordenes, setOrdenes] = useState<OrdenActiva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderDialog, setNewOrderDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [viewingOrden, setViewingOrden] = useState<OrdenActiva | null>(null);

  const [newOrderData, setNewOrderData] = useState({
    mesa_id: "",
    nombre_cliente: ""
  });

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [ordenesRes, mesasRes] = await Promise.all([
      supabase
        .from("ordenes_activas")
        .select(`*, mesa:mesas(id, numero_mesa, nombre)`)
        .eq("user_id", user.id)
        .eq("estado", "abierta")
        .order("created_at", { ascending: false }),
      supabase
        .from("mesas")
        .select("id, numero_mesa, nombre")
        .eq("user_id", user.id)
        .eq("es_activa", true)
        .order("numero_mesa")
    ]);

    if (ordenesRes.error) {
      toast.error("Error al cargar órdenes activas");
      return;
    }

    const ordenesConDetalles = await Promise.all(
      (ordenesRes.data || []).map(async (orden) => {
        const { data: detalles } = await supabase
          .from("detalle_ordenes_activas")
          .select("*")
          .eq("orden_id", orden.id);
        return { ...orden, detalles: detalles || [] };
      })
    );

    setOrdenes(ordenesConDetalles);
    setMesas(mesasRes.data || []);
    setLoading(false);
  };

  const handleCreateOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    }).select(`*, mesa:mesas(id, numero_mesa, nombre)`).single();

    if (error) {
      toast.error("Error al crear orden");
      return;
    }

    toast.success(`Orden #${nextNumber} creada`);
    setNewOrderDialog(false);
    setNewOrderData({ mesa_id: "", nombre_cliente: "" });
    
    const newOrden = { ...data, detalles: [] };
    setOrdenes([newOrden, ...ordenes]);
    onSelectActiveOrder(newOrden);
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

  const handleRemoveItem = async (detalleId: string, ordenId: string, subtotal: number) => {
    const { error } = await supabase.from("detalle_ordenes_activas").delete().eq("id", detalleId);

    if (error) {
      toast.error("Error al eliminar item");
      return;
    }

    const orden = ordenes.find(o => o.id === ordenId);
    if (orden) {
      const newTotal = Math.max(0, orden.total - subtotal);
      await supabase.from("ordenes_activas").update({ total: newTotal }).eq("id", ordenId);
    }

    fetchData();
    if (viewingOrden?.id === ordenId) {
      const updated = ordenes.find(o => o.id === ordenId);
      if (updated) {
        setViewingOrden({ ...updated, detalles: updated.detalles.filter(d => d.id !== detalleId), total: Math.max(0, updated.total - subtotal) });
      }
    }
  };

  const handleDeleteOrder = async (ordenId: string) => {
    const { error } = await supabase.from("ordenes_activas").delete().eq("id", ordenId);
    
    if (error) {
      toast.error("Error al eliminar orden");
      return;
    }

    toast.success("Orden eliminada");
    setDetailDialog(false);
    setViewingOrden(null);
    if (selectedActiveOrder?.id === ordenId) {
      onSelectActiveOrder(null as any);
    }
    fetchData();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
  };

  const getMesaLabel = (mesa: Mesa | undefined) => {
    if (!mesa) return "Sin mesa";
    return `#${mesa.numero_mesa}${mesa.nombre ? ` ${mesa.nombre}` : ""}`;
  };

  const openDetail = (orden: OrdenActiva) => {
    setViewingOrden(orden);
    setDetailDialog(true);
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Órdenes Activas ({ordenes.length})</h3>
        <div className="flex gap-2">
          <Link to="/mesas">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <Button size="sm" onClick={() => setNewOrderDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nueva
          </Button>
        </div>
      </div>

      {ordenes.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <p className="text-sm">No hay órdenes abiertas</p>
          <Button variant="link" size="sm" onClick={() => setNewOrderDialog(true)}>
            Crear primera orden
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {ordenes.map((orden) => (
            <div
              key={orden.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                selectedActiveOrder?.id === orden.id ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelectActiveOrder(orden)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{orden.numero_orden}</span>
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {getMesaLabel(orden.mesa)}
                    </Badge>
                  </div>
                  {orden.nombre_cliente && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" />
                      {orden.nombre_cliente}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(orden.created_at), "HH:mm", { locale: es })}
                    </span>
                    <span>{orden.detalles.length} items</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{formatPrice(orden.total)}</span>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(orden); }}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Order Dialog */}
      <Dialog open={newOrderDialog} onOpenChange={setNewOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Orden Activa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mesa (opcional)</Label>
              <Select value={newOrderData.mesa_id} onValueChange={(v) => setNewOrderData({ ...newOrderData, mesa_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin mesa asignada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin mesa</SelectItem>
                  {mesas.map((mesa) => (
                    <SelectItem key={mesa.id} value={mesa.id}>
                      Mesa #{mesa.numero_mesa} {mesa.nombre && `(${mesa.nombre})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
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

      {/* Order Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {viewingOrden && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>Orden #{viewingOrden.numero_orden}</DialogTitle>
                  <Badge variant="outline">
                    {format(new Date(viewingOrden.created_at), "dd/MM HH:mm", { locale: es })}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {viewingOrden.nombre_cliente && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {viewingOrden.nombre_cliente}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <Label className="min-w-16">Mesa:</Label>
                  <Select 
                    value={viewingOrden.mesa_id || "none"} 
                    onValueChange={(v) => handleAssignMesa(viewingOrden.id, v === "none" ? null : v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin mesa</SelectItem>
                      {mesas.map((mesa) => (
                        <SelectItem key={mesa.id} value={mesa.id}>
                          Mesa #{mesa.numero_mesa} {mesa.nombre && `(${mesa.nombre})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg">
                  <div className="p-3 border-b bg-muted/50 font-medium">
                    Items ({viewingOrden.detalles.length})
                  </div>
                  <div className="divide-y max-h-48 overflow-y-auto">
                    {viewingOrden.detalles.map((detalle) => (
                      <div key={detalle.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{detalle.nombre_item}</p>
                          <p className="text-xs text-muted-foreground">
                            {detalle.cantidad} x {formatPrice(detalle.precio_unitario)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{formatPrice(detalle.subtotal)}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleRemoveItem(detalle.id, viewingOrden.id, detalle.subtotal)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {viewingOrden.detalles.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Sin items - Selecciona esta orden y agrega del menú
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold p-3 bg-muted rounded-lg">
                  <span>Total</span>
                  <span>{formatPrice(viewingOrden.total)}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="destructive" size="sm" onClick={() => handleDeleteOrder(viewingOrden.id)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
                <Button variant="outline" onClick={() => setDetailDialog(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
