import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileDown, Cloud, ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

interface OrderDetail {
  id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Order {
  id: string;
  numero_orden: number;
  fecha: string;
  total: number;
  comentario: string | null;
  detalles: OrderDetail[];
}

interface ManualItem {
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
}

const emptyItem = (): ManualItem => ({ nombre_item: "", cantidad: 1, precio_unitario: 0 });

const HistorialDiario = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingToDrive, setSavingToDrive] = useState(false);

  // PIN dialog state
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "edit" | null>(null);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);

  // Manual sale dialog
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualComment, setManualComment] = useState("");
  const [manualItems, setManualItems] = useState<ManualItem[]>([emptyItem()]);
  const [savingManual, setSavingManual] = useState(false);

  // Edit order dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editComment, setEditComment] = useState("");
  const [editItems, setEditItems] = useState<ManualItem[]>([emptyItem()]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchOrdersForDate();
  }, [selectedDate]);

  const fetchOrdersForDate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      const { data: ordersData, error: ordersError } = await supabase
        .from("ordenes_pos")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", dayStart)
        .lte("fecha", dayEnd)
        .order("fecha", { ascending: true });

      if (ordersError) throw ordersError;

      const ordersWithDetails: Order[] = [];

      for (const order of ordersData || []) {
        const { data: detalles, error: detallesError } = await supabase
          .from("detalle_ordenes_pos")
          .select("*")
          .eq("orden_id", order.id);

        if (detallesError) throw detallesError;

        ordersWithDetails.push({
          ...order,
          detalles: detalles || [],
        });
      }

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const totalDiario = orders.reduce((sum, order) => sum + Number(order.total), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ─── PIN flow ────────────────────────────────────────────────────────────────

  const requestPin = (action: "add" | "edit", order?: Order) => {
    setPendingAction(action);
    if (order) setTargetOrder(order);
    setShowPinDialog(true);
  };

  const handlePinSuccess = () => {
    if (pendingAction === "add") {
      setManualItems([emptyItem()]);
      setManualComment("");
      setShowManualDialog(true);
    } else if (pendingAction === "edit" && targetOrder) {
      setEditComment(targetOrder.comentario || "");
      setEditItems(
        targetOrder.detalles.length > 0
          ? targetOrder.detalles.map((d) => ({
              nombre_item: d.nombre_item,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
            }))
          : [emptyItem()]
      );
      setShowEditDialog(true);
    }
    setPendingAction(null);
  };

  // ─── Manual sale ─────────────────────────────────────────────────────────────

  const manualTotal = manualItems.reduce(
    (s, i) => s + Number(i.cantidad) * Number(i.precio_unitario),
    0
  );

  const handleAddManualItem = () =>
    setManualItems((prev) => [...prev, emptyItem()]);

  const handleRemoveManualItem = (idx: number) =>
    setManualItems((prev) => prev.filter((_, i) => i !== idx));

  const handleManualItemChange = (
    idx: number,
    field: keyof ManualItem,
    value: string | number
  ) =>
    setManualItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const handleSaveManual = async () => {
    if (manualItems.some((i) => !i.nombre_item.trim())) {
      toast({ title: "Error", description: "Todos los ítems deben tener nombre", variant: "destructive" });
      return;
    }
    setSavingManual(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get max numero_orden for this user
      const { data: maxData } = await supabase
        .from("ordenes_pos")
        .select("numero_orden")
        .eq("user_id", user.id)
        .order("numero_orden", { ascending: false })
        .limit(1);

      const nextNum = maxData && maxData.length > 0 ? maxData[0].numero_orden + 1 : 1;

      // Set timestamp to noon of selected date to preserve the date
      const fechaOrden = new Date(selectedDate);
      fechaOrden.setHours(12, 0, 0, 0);

      const { data: newOrder, error: orderError } = await supabase
        .from("ordenes_pos")
        .insert({
          user_id: user.id,
          numero_orden: nextNum,
          total: manualTotal,
          fecha: fechaOrden.toISOString(),
          comentario: manualComment || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const detallesInsert = manualItems.map((item) => ({
        orden_id: newOrder.id,
        nombre_item: item.nombre_item.trim(),
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.cantidad) * Number(item.precio_unitario),
      }));

      const { error: detError } = await supabase
        .from("detalle_ordenes_pos")
        .insert(detallesInsert);

      if (detError) throw detError;

      toast({ title: "Venta ingresada", description: `Orden #${nextNum} registrada correctamente` });
      setShowManualDialog(false);
      fetchOrdersForDate();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo guardar la venta", variant: "destructive" });
    } finally {
      setSavingManual(false);
    }
  };

  // ─── Edit order ──────────────────────────────────────────────────────────────

  const editTotal = editItems.reduce(
    (s, i) => s + Number(i.cantidad) * Number(i.precio_unitario),
    0
  );

  const handleAddEditItem = () =>
    setEditItems((prev) => [...prev, emptyItem()]);

  const handleRemoveEditItem = (idx: number) =>
    setEditItems((prev) => prev.filter((_, i) => i !== idx));

  const handleEditItemChange = (
    idx: number,
    field: keyof ManualItem,
    value: string | number
  ) =>
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const handleSaveEdit = async () => {
    if (!targetOrder) return;
    if (editItems.some((i) => !i.nombre_item.trim())) {
      toast({ title: "Error", description: "Todos los ítems deben tener nombre", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      // Update order header
      const { error: orderError } = await supabase
        .from("ordenes_pos")
        .update({ total: editTotal, comentario: editComment || null })
        .eq("id", targetOrder.id);

      if (orderError) throw orderError;

      // Delete old details and reinsert
      const { error: delError } = await supabase
        .from("detalle_ordenes_pos")
        .delete()
        .eq("orden_id", targetOrder.id);

      if (delError) throw delError;

      const detallesInsert = editItems.map((item) => ({
        orden_id: targetOrder.id,
        nombre_item: item.nombre_item.trim(),
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.cantidad) * Number(item.precio_unitario),
      }));

      const { error: detError } = await supabase
        .from("detalle_ordenes_pos")
        .insert(detallesInsert);

      if (detError) throw detError;

      toast({ title: "Orden actualizada", description: `Orden #${targetOrder.numero_orden} editada correctamente` });
      setShowEditDialog(false);
      setTargetOrder(null);
      fetchOrdersForDate();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo editar la orden", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Export ──────────────────────────────────────────────────────────────────

  const handleExportToExcel = () => {
    if (orders.length === 0) {
      toast({ title: "Sin datos", description: "No hay órdenes para exportar en esta fecha", variant: "destructive" });
      return;
    }

    const exportData: any[] = [];

    orders.forEach((order) => {
      order.detalles.forEach((detalle) => {
        exportData.push({
          "Número de Orden": order.numero_orden,
          "Hora": format(new Date(order.fecha), "HH:mm:ss"),
          "Producto": detalle.nombre_item,
          "Cantidad": detalle.cantidad,
          "Precio Unitario": detalle.precio_unitario,
          "Subtotal": detalle.subtotal,
          "Total Orden": order.total,
          "Comentario": order.comentario || "",
        });
      });
    });

    exportData.push({
      "Número de Orden": "",
      "Hora": "",
      "Producto": "TOTAL DEL DÍA",
      "Cantidad": "",
      "Precio Unitario": "",
      "Subtotal": "",
      "Total Orden": totalDiario,
      "Comentario": "",
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Órdenes");

    const fileName = `ordenes_${format(selectedDate, "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({ title: "Exportado", description: `Archivo ${fileName} descargado correctamente` });
  };

  const handleSaveToGoogleDrive = async () => {
    if (!webhookUrl) {
      toast({ title: "Error", description: "Por favor ingresa tu URL de webhook de Zapier", variant: "destructive" });
      return;
    }
    if (orders.length === 0) {
      toast({ title: "Sin datos", description: "No hay órdenes para guardar en esta fecha", variant: "destructive" });
      return;
    }

    setSavingToDrive(true);
    try {
      const exportData = orders.map((order) => ({
        numero_orden: order.numero_orden,
        fecha: format(new Date(order.fecha), "yyyy-MM-dd HH:mm:ss"),
        total: order.total,
        comentario: order.comentario,
        detalles: order.detalles.map((d) => ({
          producto: d.nombre_item,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
        })),
      }));

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          fecha: format(selectedDate, "yyyy-MM-dd"),
          total_diario: totalDiario,
          ordenes: exportData,
          timestamp: new Date().toISOString(),
        }),
      });

      toast({ title: "Enviado", description: "Los datos fueron enviados a Zapier. Verifica tu Google Drive." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo enviar a Google Drive", variant: "destructive" });
    } finally {
      setSavingToDrive(false);
    }
  };

  // ─── Item rows helper ─────────────────────────────────────────────────────────

  const ItemRows = ({
    items,
    onAdd,
    onRemove,
    onChange,
    total,
  }: {
    items: ManualItem[];
    onAdd: () => void;
    onRemove: (i: number) => void;
    onChange: (i: number, field: keyof ManualItem, value: string | number) => void;
    total: number;
  }) => (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            {idx === 0 && <Label className="text-xs mb-1 block">Producto</Label>}
            <Input
              placeholder="Nombre del producto"
              value={item.nombre_item}
              onChange={(e) => onChange(idx, "nombre_item", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            {idx === 0 && <Label className="text-xs mb-1 block">Cant.</Label>}
            <Input
              type="number"
              min={1}
              value={item.cantidad}
              onChange={(e) => onChange(idx, "cantidad", e.target.value)}
            />
          </div>
          <div className="col-span-3">
            {idx === 0 && <Label className="text-xs mb-1 block">Precio unit.</Label>}
            <Input
              type="number"
              min={0}
              value={item.precio_unitario}
              onChange={(e) => onChange(idx, "precio_unitario", e.target.value)}
            />
          </div>
          <div className="col-span-2 flex justify-end">
            {idx === 0 && <div className="text-xs mb-1 block invisible">x</div>}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onRemove(idx)}
              disabled={items.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd} className="w-full mt-1">
        <Plus className="h-4 w-4 mr-1" /> Agregar ítem
      </Button>
      <div className="flex justify-between items-center pt-2 border-t">
        <span className="text-sm text-muted-foreground">Total calculado:</span>
        <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Historial Diario</h1>
          <Button onClick={() => requestPin("add")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Venta Manual
          </Button>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {orders.length} orden{orders.length !== 1 ? "es" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                disabled={selectedDate >= new Date()}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Button onClick={handleExportToExcel} className="flex-1">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="webhook" className="text-sm">
                  Webhook Zapier (para Google Drive)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook"
                    placeholder="https://hooks.zapier.com/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveToGoogleDrive} disabled={savingToDrive} variant="secondary">
                    <Cloud className="h-4 w-4 mr-2" />
                    {savingToDrive ? "Enviando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No hay órdenes para esta fecha</p>
              <Button className="mt-4" onClick={() => requestPin("add")}>
                <Plus className="h-4 w-4 mr-2" /> Ingresar venta manualmente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Collapsible
                key={order.id}
                open={expandedOrders.has(order.id)}
                onOpenChange={() => toggleOrderExpanded(order.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            #{order.numero_orden}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {format(new Date(order.fecha), "HH:mm:ss")}
                            </p>
                            {order.comentario && (
                              <p className="text-sm text-muted-foreground">{order.comentario}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-foreground">
                            {formatPrice(Number(order.total))}
                          </p>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestPin("edit", order);
                            }}
                            title="Editar orden"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {expandedOrders.has(order.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-muted-foreground">
                              <th className="pb-2">Producto</th>
                              <th className="pb-2 text-center">Cantidad</th>
                              <th className="pb-2 text-right">Precio</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.detalles.map((detalle) => (
                              <tr key={detalle.id} className="border-b border-muted last:border-0">
                                <td className="py-2 text-foreground">{detalle.nombre_item}</td>
                                <td className="py-2 text-center text-foreground">{detalle.cantidad}</td>
                                <td className="py-2 text-right text-muted-foreground">
                                  {formatPrice(Number(detalle.precio_unitario))}
                                </td>
                                <td className="py-2 text-right font-medium text-foreground">
                                  {formatPrice(Number(detalle.subtotal))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}

            {/* Daily Total */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total del día</p>
                    <p className="text-sm text-muted-foreground">
                      {orders.length} orden{orders.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-primary">{formatPrice(totalDiario)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* PIN Dialog */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={(open) => {
          setShowPinDialog(open);
          if (!open) { setPendingAction(null); setTargetOrder(null); }
        }}
        onSuccess={handlePinSuccess}
        title={pendingAction === "add" ? "Ingresar Venta Manual" : "Editar Orden"}
        description={
          pendingAction === "add"
            ? `Ingresa tu PIN para registrar una venta en ${format(selectedDate, "d/MM/yyyy")}`
            : `Ingresa tu PIN para editar la Orden #${targetOrder?.numero_orden}`
        }
      />

      {/* Manual Sale Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Ingresar Venta Manual — {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1 block">Comentario (opcional)</Label>
              <Textarea
                placeholder="Ej: Venta en efectivo no registrada..."
                value={manualComment}
                onChange={(e) => setManualComment(e.target.value)}
                rows={2}
              />
            </div>
            <ItemRows
              items={manualItems}
              onAdd={handleAddManualItem}
              onRemove={handleRemoveManualItem}
              onChange={handleManualItemChange}
              total={manualTotal}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveManual} disabled={savingManual || manualTotal === 0}>
              {savingManual ? "Guardando..." : "Registrar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Orden #{targetOrder?.numero_orden}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1 block">Comentario (opcional)</Label>
              <Textarea
                placeholder="Comentario de la orden..."
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={2}
              />
            </div>
            <ItemRows
              items={editItems}
              onAdd={handleAddEditItem}
              onRemove={handleRemoveEditItem}
              onChange={handleEditItemChange}
              total={editTotal}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || editTotal === 0}>
              {savingEdit ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistorialDiario;
