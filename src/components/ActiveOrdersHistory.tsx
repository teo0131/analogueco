import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, MapPin, Users, ChevronRight, Trash2, ShoppingBag } from "lucide-react";
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

interface ActiveOrdersHistoryProps {
  onSelectOrder: (orden: OrdenActiva) => void;
  refreshKey?: number;
}

export const ActiveOrdersHistory = ({ onSelectOrder, refreshKey }: ActiveOrdersHistoryProps) => {
  const [ordenes, setOrdenes] = useState<OrdenActiva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState(false);
  const [viewingOrden, setViewingOrden] = useState<OrdenActiva | null>(null);

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
      setLoading(false);
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
    if (viewingOrden?.id === ordenId) {
      const mesa = mesas.find(m => m.id === mesaId);
      setViewingOrden({ ...viewingOrden, mesa_id: mesaId, mesa: mesa || undefined });
    }
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
      setViewingOrden({
        ...viewingOrden,
        detalles: viewingOrden.detalles.filter(d => d.id !== detalleId),
        total: Math.max(0, viewingOrden.total - subtotal)
      });
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
    fetchData();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
  };

  const getMesaLabel = (mesa: Mesa | undefined) => {
    if (!mesa) return "Sin mesa";
    return `Mesa #${mesa.numero_mesa}${mesa.nombre ? ` (${mesa.nombre})` : ""}`;
  };

  const openDetail = (orden: OrdenActiva) => {
    setViewingOrden(orden);
    setDetailDialog(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando órdenes activas...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-secondary">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Órdenes en Proceso
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {ordenes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 px-4">
                No hay órdenes activas en este momento
              </p>
            ) : (
              <div className="space-y-2 p-4">
                {ordenes.map((orden) => (
                  <div key={orden.id} className="relative group">
                    <Button
                      variant="outline"
                      onClick={() => openDetail(orden)}
                      className="w-full h-auto flex items-center justify-between p-4 hover:bg-muted"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-primary">Orden #{orden.numero_orden}</span>
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {getMesaLabel(orden.mesa)}
                          </Badge>
                        </div>
                        {orden.nombre_cliente && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Users className="w-3 h-3" />
                            {orden.nombre_cliente}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(orden.created_at), "dd/MM HH:mm", { locale: es })}
                          </span>
                          <span>{orden.detalles.length} items</span>
                        </div>
                        <p className="text-lg font-bold mt-1">{formatPrice(orden.total)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {viewingOrden && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>Orden #{viewingOrden.numero_orden}</DialogTitle>
                  <Badge variant="secondary">
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
                    Items Pedidos ({viewingOrden.detalles.length})
                  </div>
                  <div className="divide-y max-h-48 overflow-y-auto">
                    {viewingOrden.detalles.map((detalle) => (
                      <div key={detalle.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{detalle.nombre_item}</p>
                          <p className="text-xs text-muted-foreground">
                            {detalle.cantidad} x {formatPrice(detalle.precio_unitario)}
                          </p>
                          {detalle.notas && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              Nota: {detalle.notas}
                            </p>
                          )}
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
                        Sin items todavía
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
                  Eliminar Orden
                </Button>
                <Button variant="outline" onClick={() => setDetailDialog(false)}>Cerrar</Button>
                <Button onClick={() => {
                  onSelectOrder(viewingOrden);
                  setDetailDialog(false);
                }}>
                  Seleccionar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
