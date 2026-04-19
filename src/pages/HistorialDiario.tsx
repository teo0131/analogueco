import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileDown, Cloud, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Search, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

interface OrderDetail {
  id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  menu_item_id?: string | null;
}

interface Order {
  id: string;
  numero_orden: number;
  fecha: string;
  total: number;
  comentario: string | null;
  detalles: OrderDetail[];
}

interface MenuItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: string | null;
  tipo_item: string;
  stock_actual: number;
  es_activo: boolean;
}

interface CartItem {
  menu_item_id: string;
  nombre_item: string;
  precio_unitario: number;
  cantidad: number;
  tipo_item: string;
}

const HistorialDiario = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingToDrive, setSavingToDrive] = useState(false);

  // PIN
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "edit" | null>(null);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);

  // Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mesas, setMesas] = useState<{ id: string; numero_mesa: number; nombre: string | null }[]>([]);

  // Sale dialog (POS-like)
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [saleMode, setSaleMode] = useState<"add" | "edit">("add");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [saleHora, setSaleHora] = useState("12:00");
  const [saleMesa, setSaleMesa] = useState<string>("none");
  const [saleCliente, setSaleCliente] = useState("");
  const [saleMetodoPago, setSaleMetodoPago] = useState<string>("Efectivo");
  const [saleComment, setSaleComment] = useState("");
  const [adjustInventory, setAdjustInventory] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchOrdersForDate(); }, [selectedDate]);
  useEffect(() => { fetchMenu(); fetchMesas(); }, []);

  const fetchMenu = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("menu_items")
      .select("id, nombre, precio, categoria, tipo_item, stock_actual, es_activo")
      .eq("user_id", user.id)
      .eq("es_activo", true)
      .order("orden_display", { ascending: true });
    setMenuItems(data || []);
  };

  const fetchMesas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("mesas")
      .select("id, numero_mesa, nombre")
      .eq("user_id", user.id)
      .eq("es_activa", true)
      .order("numero_mesa", { ascending: true });
    setMesas(data || []);
  };

  const fetchOrdersForDate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();
      const { data: ordersData, error } = await supabase
        .from("ordenes_pos")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", dayStart)
        .lte("fecha", dayEnd)
        .order("fecha", { ascending: true });
      if (error) throw error;
      const out: Order[] = [];
      for (const order of ordersData || []) {
        const { data: detalles } = await supabase
          .from("detalle_ordenes_pos").select("*").eq("orden_id", order.id);
        out.push({ ...order, detalles: detalles || [] });
      }
      setOrders(out);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudieron cargar las órdenes", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const toggleOrderExpanded = (id: string) => {
    const s = new Set(expandedOrders);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedOrders(s);
  };

  const totalDiario = orders.reduce((s, o) => s + Number(o.total), 0);
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(p);

  // ─── PIN ───
  const requestPin = (action: "add" | "edit", order?: Order) => {
    setPendingAction(action);
    if (order) setTargetOrder(order);
    setShowPinDialog(true);
  };

  const handlePinSuccess = () => {
    if (pendingAction === "add") {
      openSaleDialog("add");
    } else if (pendingAction === "edit" && targetOrder) {
      openSaleDialog("edit", targetOrder);
    }
    setPendingAction(null);
  };

  // ─── Sale dialog ───
  const openSaleDialog = (mode: "add" | "edit", order?: Order) => {
    setSaleMode(mode);
    setSearchTerm("");
    setSelectedCategory("Todas");
    setAdjustInventory(mode === "add"); // por defecto descuenta solo en nueva venta
    if (mode === "add") {
      setCart([]);
      setSaleHora(format(new Date(), "HH:mm"));
      setSaleMesa("none");
      setSaleCliente("");
      setSaleMetodoPago("Efectivo");
      setSaleComment("");
    } else if (order) {
      // Cargar detalles existentes al carrito
      setCart(order.detalles.map(d => ({
        menu_item_id: d.menu_item_id || "",
        nombre_item: d.nombre_item,
        precio_unitario: Number(d.precio_unitario),
        cantidad: Number(d.cantidad),
        tipo_item: "manual",
      })));
      setSaleHora(format(new Date(order.fecha), "HH:mm"));
      setSaleMesa("none");
      setSaleCliente("");
      setSaleMetodoPago("Efectivo");
      setSaleComment(order.comentario || "");
    }
    setShowSaleDialog(true);
  };

  const categories = useMemo(() => {
    const set = new Set<string>(["Todas"]);
    menuItems.forEach(i => i.categoria && set.add(i.categoria));
    return Array.from(set);
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    return menuItems.filter(i => {
      const matchCat = selectedCategory === "Todas" || i.categoria === selectedCategory;
      const matchSearch = !searchTerm || i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.id);
      if (existing) {
        return prev.map(c => c.menu_item_id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      }
      return [...prev, {
        menu_item_id: item.id,
        nombre_item: item.nombre,
        precio_unitario: Number(item.precio),
        cantidad: 1,
        tipo_item: item.tipo_item,
      }];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      const newQty = c.cantidad + delta;
      return newQty <= 0 ? c : { ...c, cantidad: newQty };
    }).filter((c, i) => i !== idx || c.cantidad > 0));
  };

  const removeCartItem = (idx: number) =>
    setCart(prev => prev.filter((_, i) => i !== idx));

  const cartTotal = cart.reduce((s, c) => s + c.cantidad * c.precio_unitario, 0);

  const discountInventoryFor = async (
    cartItems: CartItem[],
    userId: string,
    refLabel: string
  ): Promise<string[]> => {
    const warnings: string[] = [];
    for (const ci of cartItems) {
      if (!ci.menu_item_id) continue;
      const { data: menuItem } = await supabase
        .from("menu_items")
        .select("id, nombre, tipo_item, stock_actual")
        .eq("id", ci.menu_item_id)
        .maybeSingle();
      if (!menuItem) continue;

      if (menuItem.tipo_item === "retail") {
        if (menuItem.stock_actual <= 0)
          warnings.push(`⚠️ ${menuItem.nombre}: SIN STOCK`);
        const nuevoStock = Number(menuItem.stock_actual) - ci.cantidad;
        await supabase.from("menu_items").update({ stock_actual: nuevoStock }).eq("id", menuItem.id);
      } else if (menuItem.tipo_item === "receta") {
        const { data: recetaData } = await supabase
          .from("recetas")
          .select(`id, detalle_recetas (insumo_id, cantidad_insumo_por_unidad, insumo:productos!detalle_recetas_insumo_id_fkey (id, nombre, stock_actual, costo_promedio))`)
          .eq("menu_item_id", menuItem.id)
          .maybeSingle();
        if (recetaData && (recetaData as any).detalle_recetas) {
          for (const dr of (recetaData as any).detalle_recetas) {
            const insumo = dr.insumo as any;
            const cantidadRequerida = dr.cantidad_insumo_por_unidad * ci.cantidad;
            if (insumo.stock_actual <= 0)
              warnings.push(`⚠️ ${insumo.nombre} (${menuItem.nombre}): SIN STOCK`);
            else if (insumo.stock_actual < cantidadRequerida)
              warnings.push(`⚠️ ${insumo.nombre}: Stock insuficiente`);
            const nuevoStock = insumo.stock_actual - cantidadRequerida;
            await supabase.from("productos").update({ stock_actual: nuevoStock }).eq("id", insumo.id);
            await supabase.from("movimientos_inventario").insert({
              producto_id: insumo.id,
              tipo_movimiento: "consumo",
              cantidad: cantidadRequerida,
              stock_resultante: nuevoStock,
              costo_unitario_referencia: insumo.costo_promedio,
              referencia: refLabel,
              notas: `Consumo para: ${menuItem.nombre}`,
              user_id: userId,
            });
          }
        }
      }
    }
    return warnings;
  };

  const handleSaveSale = async (keepOpen = false) => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacío", description: "Agrega al menos un producto", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Combinar fecha seleccionada + hora del input
      const [hh, mm] = saleHora.split(":").map(Number);
      const fechaOrden = new Date(selectedDate);
      fechaOrden.setHours(hh || 12, mm || 0, 0, 0);

      // Comentario compuesto
      const partes: string[] = [];
      if (saleMesa !== "none") {
        const m = mesas.find(x => x.id === saleMesa);
        if (m) partes.push(`Mesa: ${m.numero_mesa}${m.nombre ? ` (${m.nombre})` : ""}`);
      }
      if (saleCliente.trim()) partes.push(`Cliente: ${saleCliente.trim()}`);
      if (saleMetodoPago) partes.push(`Pago: ${saleMetodoPago}`);
      if (saleComment.trim()) partes.push(saleComment.trim());
      const comentarioFinal = partes.join(" — ") || null;

      let orderId: string;
      let orderNumber: number;

      if (saleMode === "add") {
        const { data: maxData } = await supabase
          .from("ordenes_pos").select("numero_orden")
          .eq("user_id", user.id).order("numero_orden", { ascending: false }).limit(1);
        orderNumber = maxData && maxData.length > 0 ? maxData[0].numero_orden + 1 : 1;

        const { data: newOrder, error } = await supabase
          .from("ordenes_pos")
          .insert({
            user_id: user.id,
            numero_orden: orderNumber,
            total: cartTotal,
            fecha: fechaOrden.toISOString(),
            comentario: comentarioFinal,
          }).select().single();
        if (error) throw error;
        orderId = newOrder.id;

        const detalles = cart.map(c => ({
          orden_id: orderId,
          menu_item_id: c.menu_item_id || null,
          nombre_item: c.nombre_item,
          cantidad: c.cantidad,
          precio_unitario: c.precio_unitario,
          subtotal: c.cantidad * c.precio_unitario,
        }));
        const { error: detErr } = await supabase.from("detalle_ordenes_pos").insert(detalles);
        if (detErr) throw detErr;
      } else {
        if (!targetOrder) return;
        orderId = targetOrder.id;
        orderNumber = targetOrder.numero_orden;

        const { error: upErr } = await supabase.from("ordenes_pos")
          .update({ total: cartTotal, comentario: comentarioFinal, fecha: fechaOrden.toISOString() })
          .eq("id", orderId);
        if (upErr) throw upErr;

        await supabase.from("detalle_ordenes_pos").delete().eq("orden_id", orderId);
        const detalles = cart.map(c => ({
          orden_id: orderId,
          menu_item_id: c.menu_item_id || null,
          nombre_item: c.nombre_item,
          cantidad: c.cantidad,
          precio_unitario: c.precio_unitario,
          subtotal: c.cantidad * c.precio_unitario,
        }));
        const { error: detErr } = await supabase.from("detalle_ordenes_pos").insert(detalles);
        if (detErr) throw detErr;
      }

      // Inventario
      let warnings: string[] = [];
      if (adjustInventory) {
        warnings = await discountInventoryFor(cart, user.id, `Venta Manual - Orden #${orderNumber}`);
      }

      toast({
        title: saleMode === "add" ? "Venta registrada" : "Orden actualizada",
        description: `Orden #${orderNumber} · ${formatPrice(cartTotal)}${warnings.length ? ` · ${warnings.length} aviso(s) de stock` : ""}`,
      });
      if (warnings.length) {
        warnings.slice(0, 3).forEach(w =>
          toast({ title: "Stock", description: w, variant: "destructive" }));
      }

      if (keepOpen && saleMode === "add") {
        // Limpiar carrito y datos de cliente, mantener fecha/hora/mesa/método para registro en cadena
        setCart([]);
        setSaleCliente("");
        setSaleComment("");
        setSearchTerm("");
      } else {
        setShowSaleDialog(false);
        setTargetOrder(null);
      }
      fetchOrdersForDate();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo guardar la venta", variant: "destructive" });
    } finally { setSaving(false); }
  };

  // ─── Export ───
  const handleExportToExcel = () => {
    if (orders.length === 0) {
      toast({ title: "Sin datos", description: "No hay órdenes para exportar en esta fecha", variant: "destructive" });
      return;
    }
    const exportData: any[] = [];
    orders.forEach(order => {
      order.detalles.forEach(d => {
        exportData.push({
          "Número de Orden": order.numero_orden,
          "Hora": format(new Date(order.fecha), "HH:mm:ss"),
          "Producto": d.nombre_item,
          "Cantidad": d.cantidad,
          "Precio Unitario": d.precio_unitario,
          "Subtotal": d.subtotal,
          "Total Orden": order.total,
          "Comentario": order.comentario || "",
        });
      });
    });
    exportData.push({ "Producto": "TOTAL DEL DÍA", "Total Orden": totalDiario });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Órdenes");
    XLSX.writeFile(wb, `ordenes_${format(selectedDate, "yyyy-MM-dd")}.xlsx`);
    toast({ title: "Exportado" });
  };

  const handleSaveToGoogleDrive = async () => {
    if (!webhookUrl) { toast({ title: "Error", description: "Ingresa el webhook", variant: "destructive" }); return; }
    if (orders.length === 0) { toast({ title: "Sin datos", variant: "destructive" }); return; }
    setSavingToDrive(true);
    try {
      await fetch(webhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json" }, mode: "no-cors",
        body: JSON.stringify({
          fecha: format(selectedDate, "yyyy-MM-dd"),
          total_diario: totalDiario,
          ordenes: orders, timestamp: new Date().toISOString(),
        }),
      });
      toast({ title: "Enviado a Zapier" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingToDrive(false); }
  };

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Historial Diario</h1>
          <Button onClick={() => requestPin("add")} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Venta Manual
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
              <div className="text-center">
                <p className="text-lg font-semibold">{format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                <p className="text-sm text-muted-foreground">{orders.length} orden{orders.length !== 1 ? "es" : ""}</p>
              </div>
              <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, 1))} disabled={selectedDate >= new Date()}>
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Button onClick={handleExportToExcel} className="flex-1">
                <FileDown className="h-4 w-4 mr-2" /> Exportar a Excel
              </Button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="webhook" className="text-sm">Webhook Zapier (Google Drive)</Label>
                <div className="flex gap-2">
                  <Input id="webhook" placeholder="https://hooks.zapier.com/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
                  <Button onClick={handleSaveToGoogleDrive} disabled={savingToDrive} variant="secondary">
                    <Cloud className="h-4 w-4 mr-2" />{savingToDrive ? "Enviando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {orders.map(order => (
              <Collapsible key={order.id} open={expandedOrders.has(order.id)} onOpenChange={() => toggleOrderExpanded(order.id)}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">#{order.numero_orden}</div>
                          <div>
                            <p className="font-medium">{format(new Date(order.fecha), "HH:mm:ss")}</p>
                            {order.comentario && <p className="text-sm text-muted-foreground">{order.comentario}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold">{formatPrice(Number(order.total))}</p>
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); requestPin("edit", order); }}
                            title="Editar orden">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {expandedOrders.has(order.id) ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
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
                            {order.detalles.map(d => (
                              <tr key={d.id} className="border-b border-muted last:border-0">
                                <td className="py-2">{d.nombre_item}</td>
                                <td className="py-2 text-center">{d.cantidad}</td>
                                <td className="py-2 text-right text-muted-foreground">{formatPrice(Number(d.precio_unitario))}</td>
                                <td className="py-2 text-right font-medium">{formatPrice(Number(d.subtotal))}</td>
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

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total del día</p>
                    <p className="text-sm text-muted-foreground">{orders.length} orden{orders.length !== 1 ? "es" : ""}</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">{formatPrice(totalDiario)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* PIN */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={(open) => {
          setShowPinDialog(open);
          if (!open) { setPendingAction(null); setTargetOrder(null); }
        }}
        onSuccess={handlePinSuccess}
        title={pendingAction === "add" ? "Ingresar Venta Manual" : "Editar Orden"}
        description={pendingAction === "add"
          ? `Ingresa tu PIN para registrar una venta en ${format(selectedDate, "d/MM/yyyy")}`
          : `Ingresa tu PIN para editar la Orden #${targetOrder?.numero_orden}`}
      />

      {/* Sale Dialog (POS-like) */}
      <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {saleMode === "add" ? <Plus className="h-5 w-5 text-primary" /> : <Pencil className="h-5 w-5 text-primary" />}
              {saleMode === "add" ? "Nueva Venta" : `Editar Orden #${targetOrder?.numero_orden}`}
              <Badge variant="outline" className="ml-2">
                {format(selectedDate, "d MMM yyyy", { locale: es })} {saleHora}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 overflow-hidden">
            {/* IZQUIERDA: Menú */}
            <div className="md:col-span-3 flex flex-col gap-3 overflow-hidden">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="flex-1 border rounded-md p-2 min-h-[280px]">
                {filteredMenu.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Sin productos</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredMenu.map(item => (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="text-left p-2 rounded-md border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <p className="font-medium text-sm line-clamp-2">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.categoria || "—"}</p>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(Number(item.precio))}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* DERECHA: Carrito + Datos */}
            <div className="md:col-span-2 flex flex-col gap-3 overflow-hidden">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Hora</Label>
                  <Input type="time" value={saleHora} onChange={e => setSaleHora(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Método de pago</Label>
                  <Select value={saleMetodoPago} onValueChange={setSaleMetodoPago}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Nequi">Nequi</SelectItem>
                      <SelectItem value="Daviplata">Daviplata</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Mesa</Label>
                  <Select value={saleMesa} onValueChange={setSaleMesa}>
                    <SelectTrigger><SelectValue placeholder="Sin mesa" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin mesa</SelectItem>
                      {mesas.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          Mesa {m.numero_mesa}{m.nombre ? ` · ${m.nombre}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cliente (opcional)</Label>
                  <Input value={saleCliente} onChange={e => setSaleCliente(e.target.value)} placeholder="Nombre" />
                </div>
              </div>

              <div className="flex-1 border rounded-md flex flex-col overflow-hidden">
                <div className="p-2 border-b bg-muted/30">
                  <p className="text-xs font-medium">Carrito ({cart.length})</p>
                </div>
                <ScrollArea className="flex-1 p-2">
                  {cart.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-6">
                      Selecciona productos del menú
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {cart.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{c.nombre_item}</p>
                            <p className="text-xs text-muted-foreground">{formatPrice(c.precio_unitario)} c/u</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCartQty(idx, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{c.cantidad}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCartQty(idx, +1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCartItem(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/20">
                  <Textarea
                    placeholder="Comentario (opcional)"
                    value={saleComment}
                    onChange={e => setSaleComment(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={adjustInventory}
                  onChange={e => setAdjustInventory(e.target.checked)}
                  className="rounded"
                />
                Descontar inventario al guardar
              </label>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(cartTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSaleDialog(false)}>Cancelar</Button>
            {saleMode === "add" && (
              <Button
                variant="secondary"
                onClick={() => handleSaveSale(true)}
                disabled={saving || cart.length === 0}
              >
                {saving ? "Guardando..." : "Guardar y registrar otra"}
              </Button>
            )}
            <Button onClick={() => handleSaveSale(false)} disabled={saving || cart.length === 0}>
              {saving ? "Guardando..." : saleMode === "add" ? "Registrar Venta" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistorialDiario;
