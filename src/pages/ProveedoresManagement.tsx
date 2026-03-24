import { useState } from "react";
import { useDialogScrollPreserve } from "@/hooks/useDialogScrollPreserve";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Plus, Pencil, History, Building2, ShoppingCart, MessageCircle, Package, AlertTriangle, Send, Save, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

type Proveedor = {
  id: string;
  nombre: string;
  documento: string | null;
  contacto: string | null;
  whatsapp: string | null;
  observaciones: string | null;
  created_at: string;
};

type ProveedorFormData = {
  nombre: string;
  documento: string;
  contacto: string;
  whatsapp: string;
  observaciones: string;
};

type ProductoBajoStock = {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_inventario: string;
  precio_compra_habitual: number;
  cantidad_pedido_sugerida: number;
};

type OrdenItem = {
  producto_id: string;
  nombre_producto: string;
  unidad: string;
  cantidad_solicitada: number;
  precio_unitario: number;
};

const ProveedoresManagement = () => {
  const { isOpen: isDialogOpen, setDialogOpen, restoreScroll } = useDialogScrollPreserve();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: "",
    documento: "",
    contacto: "",
    whatsapp: "",
    observaciones: "",
  });

  // Order sheet state
  const [orderItems, setOrderItems] = useState<OrdenItem[]>([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(false);
  const [showSendPinDialog, setShowSendPinDialog] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Fetch proveedores
  const { data: proveedores, isLoading } = useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre");
      if (error) throw error;
      return data as Proveedor[];
    },
  });

  // Fetch compras count por proveedor
  const { data: comprasCounts } = useQuery({
    queryKey: ["proveedores-compras-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const { data, error } = await supabase
        .from("entradas_inventario")
        .select("proveedor_id")
        .eq("user_id", user.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((entrada) => {
        counts[entrada.proveedor_id] = (counts[entrada.proveedor_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch low-stock products per proveedor
  const { data: lowStockByProveedor } = useQuery({
    queryKey: ["proveedores-low-stock"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, stock_actual, stock_minimo, unidad_inventario, proveedor_id, precio_compra_habitual, cantidad_pedido_sugerida")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .not("proveedor_id", "is", null);
      if (error) throw error;
      const map: Record<string, ProductoBajoStock[]> = {};
      (data || []).forEach((p) => {
        if (p.proveedor_id && p.stock_actual <= p.stock_minimo) {
          if (!map[p.proveedor_id]) map[p.proveedor_id] = [];
          map[p.proveedor_id].push(p as ProductoBajoStock);
        }
      });
      return map;
    },
  });

  // Fetch historial de compras del proveedor seleccionado
  const { data: historialCompras } = useQuery({
    queryKey: ["proveedor-historial", selectedProveedor?.id],
    queryFn: async () => {
      if (!selectedProveedor) return [];
      const { data, error } = await supabase
        .from("entradas_inventario")
        .select(`*, detalle_entradas(cantidad, costo_unitario, costo_total, productos(nombre, unidad_inventario))`)
        .eq("proveedor_id", selectedProveedor.id)
        .order("fecha_compra", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProveedor && isHistoryOpen,
  });

  // Create/Update proveedor mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProveedorFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      if (selectedProveedor) {
        const { error } = await supabase
          .from("proveedores")
          .update({
            nombre: data.nombre,
            documento: data.documento || null,
            contacto: data.contacto || null,
            whatsapp: data.whatsapp || null,
            observaciones: data.observaciones || null,
          })
          .eq("id", selectedProveedor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("proveedores")
          .insert({
            nombre: data.nombre,
            documento: data.documento || null,
            contacto: data.contacto || null,
            whatsapp: data.whatsapp || null,
            observaciones: data.observaciones || null,
            user_id: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast.success(selectedProveedor ? "Proveedor actualizado" : "Proveedor creado");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Error al guardar proveedor: " + error.message);
    },
  });

  const handleOpenDialog = (proveedor?: Proveedor) => {
    if (proveedor) {
      setSelectedProveedor(proveedor);
      setFormData({
        nombre: proveedor.nombre,
        documento: proveedor.documento || "",
        contacto: proveedor.contacto || "",
        whatsapp: proveedor.whatsapp || "",
        observaciones: proveedor.observaciones || "",
      });
    } else {
      setSelectedProveedor(null);
      setFormData({ nombre: "", documento: "", contacto: "", whatsapp: "", observaciones: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProveedor(null);
    setFormData({ nombre: "", documento: "", contacto: "", whatsapp: "", observaciones: "" });
    restoreScroll();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleViewHistory = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsHistoryOpen(true);
  };

  const handleOpenOrder = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    const lowStock = lowStockByProveedor?.[proveedor.id] || [];
    const items: OrdenItem[] = lowStock.map((p) => ({
      producto_id: p.id,
      nombre_producto: p.nombre,
      unidad: p.unidad_inventario,
      cantidad_solicitada: p.cantidad_pedido_sugerida > 0
        ? p.cantidad_pedido_sugerida
        : Math.max(p.stock_minimo * 2 - p.stock_actual, 1),
      precio_unitario: p.precio_compra_habitual || 0,
    }));
    setOrderItems(items);
    generateOrderMessage(proveedor, items);
    setEditingMessage(false);
    setIsOrderSheetOpen(true);
  };

  const generateOrderMessage = (proveedor: Proveedor, items: OrdenItem[]) => {
    if (items.length === 0) {
      setOrderMessage(`Hola ${proveedor.nombre}, quisiéramos hacer un pedido. Por favor confirmar disponibilidad.`);
      return;
    }
    const itemLines = items
      .map((i) => `  • ${i.nombre_producto}: ${i.cantidad_solicitada} ${i.unidad}`)
      .join("\n");
    const msg = `Hola ${proveedor.nombre}, necesitamos el siguiente pedido:\n\n${itemLines}\n\nPor favor confirmar disponibilidad y precio. Gracias.`;
    setOrderMessage(msg);
  };

  const handleItemQuantityChange = (productId: string, qty: number) => {
    const updated = orderItems.map((i) =>
      i.producto_id === productId ? { ...i, cantidad_solicitada: qty } : i
    );
    setOrderItems(updated);
    if (!editingMessage && selectedProveedor) {
      generateOrderMessage(selectedProveedor, updated);
    }
  };

  const handleSaveOrder = async () => {
    if (!selectedProveedor || orderItems.length === 0) {
      toast.error("Agrega al menos un producto a la orden");
      return;
    }
    setSavingOrder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { data: orden, error: ordenError } = await supabase
        .from("ordenes_compra")
        .insert({
          user_id: user.id,
          proveedor_id: selectedProveedor.id,
          estado: "borrador",
          mensaje_generado: orderMessage,
          whatsapp_enviado: false,
        })
        .select()
        .single();
      if (ordenError) throw ordenError;
      const detalles = orderItems.map((i) => ({
        orden_id: orden.id,
        producto_id: i.producto_id,
        nombre_producto: i.nombre_producto,
        unidad: i.unidad,
        cantidad_solicitada: i.cantidad_solicitada,
        precio_unitario: i.precio_unitario,
      }));
      const { error: detallesError } = await supabase
        .from("detalle_ordenes_compra")
        .insert(detalles);
      if (detallesError) throw detallesError;
      toast.success("Orden de compra guardada como borrador");
      setIsOrderSheetOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la orden");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedProveedor?.whatsapp) {
      toast.error("Este proveedor no tiene número de WhatsApp configurado. Edítalo y agrega su número.");
      return;
    }
    setShowSendPinDialog(true);
  };

  const handleSendWhatsAppConfirm = async () => {
    if (!selectedProveedor) return;
    setSendingWhatsApp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // First save the order
      const { data: orden, error: ordenError } = await supabase
        .from("ordenes_compra")
        .insert({
          user_id: user.id,
          proveedor_id: selectedProveedor.id,
          estado: "borrador",
          mensaje_generado: orderMessage,
          whatsapp_enviado: false,
        })
        .select()
        .single();
      if (ordenError) throw ordenError;

      const detalles = orderItems.map((i) => ({
        orden_id: orden.id,
        producto_id: i.producto_id,
        nombre_producto: i.nombre_producto,
        unidad: i.unidad,
        cantidad_solicitada: i.cantidad_solicitada,
        precio_unitario: i.precio_unitario,
      }));
      await supabase.from("detalle_ordenes_compra").insert(detalles);

      // Send via edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-whatsapp-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            numero_destino: selectedProveedor.whatsapp,
            mensaje: orderMessage,
            orden_id: orden.id,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        if (result.code === "WA_NOT_CONFIGURED") {
          toast.error("WhatsApp Business no está configurado. Ve a Configuración de Cuenta → Integración WhatsApp.");
        } else {
          throw new Error(result.error || "Error al enviar WhatsApp");
        }
        return;
      }
      toast.success("¡Orden enviada por WhatsApp al proveedor!");
      setIsOrderSheetOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar por WhatsApp");
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const filteredProveedores = proveedores?.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.documento && p.documento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                Gestión de Proveedores
              </h1>
              <p className="text-muted-foreground">Administra proveedores, stock y órdenes de compra</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Buscar Proveedor</CardTitle></CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proveedores ({filteredProveedores?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Stock Bajo</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">Cargando proveedores...</TableCell>
                    </TableRow>
                  ) : filteredProveedores && filteredProveedores.length > 0 ? (
                    filteredProveedores.map((proveedor) => {
                      const lowCount = lowStockByProveedor?.[proveedor.id]?.length || 0;
                      return (
                        <TableRow key={proveedor.id}>
                          <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                          <TableCell>{proveedor.documento || "-"}</TableCell>
                          <TableCell>{proveedor.contacto || "-"}</TableCell>
                          <TableCell>
                            {proveedor.whatsapp ? (
                              <span className="text-sm text-green-600 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {proveedor.whatsapp}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No configurado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{comprasCounts?.[proveedor.id] || 0} compras</Badge>
                          </TableCell>
                          <TableCell>
                            {lowCount > 0 ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                {lowCount} {lowCount === 1 ? "producto" : "productos"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600/30">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(proveedor.created_at), "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Crear orden de compra"
                              onClick={() => handleOpenOrder(proveedor)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Historial de compras"
                              onClick={() => handleViewHistory(proveedor)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar proveedor"
                              onClick={() => handleOpenDialog(proveedor)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron proveedores
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
            <DialogDescription>
              {selectedProveedor ? "Actualiza la información del proveedor" : "Completa los datos del nuevo proveedor"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre del proveedor" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Documento (NIT/CC)</Label>
                <Input id="documento" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} placeholder="123456789-0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Contacto</Label>
                <Input id="contacto" value={formData.contacto} onChange={(e) => setFormData({ ...formData, contacto: e.target.value })} placeholder="Teléfono, email, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  WhatsApp (para órdenes automáticas)
                </Label>
                <Input id="whatsapp" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="573001234567 (con código de país)" />
                <p className="text-xs text-muted-foreground">Formato: código país + número (ej: 573001234567 para Colombia)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Notas adicionales..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Historial de Compras - {selectedProveedor?.nombre}</SheetTitle>
            <SheetDescription>Todas las compras realizadas a este proveedor</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            {historialCompras && historialCompras.length > 0 ? (
              <div className="space-y-4">
                {historialCompras.map((entrada) => (
                  <Card key={entrada.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            Factura: {entrada.numero_factura_proveedor || "Sin número"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entrada.fecha_compra), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                        {entrada.valor_total_factura && (
                          <Badge variant="outline" className="text-lg">
                            ${Number(entrada.valor_total_factura).toLocaleString("es-CO")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Productos:</p>
                        <div className="space-y-1">
                          {entrada.detalle_entradas?.map((detalle: any, idx: number) => (
                            <div key={idx} className="text-sm flex justify-between items-center p-2 bg-secondary/20 rounded">
                              <span>{detalle.productos?.nombre} - {detalle.cantidad} {detalle.productos?.unidad_inventario}</span>
                              <span className="font-medium">${Number(detalle.costo_total).toLocaleString("es-CO")}</span>
                            </div>
                          ))}
                        </div>
                        {entrada.notas && (
                          <div className="mt-2 p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground">Notas:</p>
                            <p className="text-sm">{entrada.notas}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No hay compras registradas para este proveedor
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Order Sheet */}
      <Sheet open={isOrderSheetOpen} onOpenChange={setIsOrderSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orden de Compra — {selectedProveedor?.nombre}
            </SheetTitle>
            <SheetDescription>
              Revisa los productos con stock bajo, ajusta cantidades y envía por WhatsApp
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Products list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos a solicitar
              </h3>
              {orderItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  No hay productos con stock bajo vinculados a este proveedor.
                  <br />
                  <span className="text-xs mt-1 block">Vincula productos a este proveedor en Ingreso de Inventario.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.producto_id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.nombre_producto}</p>
                        <p className="text-xs text-muted-foreground">{item.unidad}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Cantidad:</Label>
                        <Input
                          type="number"
                          value={item.cantidad_solicitada}
                          onChange={(e) => handleItemQuantityChange(item.producto_id, Number(e.target.value))}
                          className="w-20 h-8 text-sm"
                          min={0.1}
                          step={0.1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Message preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  Mensaje WhatsApp
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMessage(!editingMessage)}
                  className="text-xs h-7"
                >
                  {editingMessage ? "Vista previa" : "Editar mensaje"}
                </Button>
              </div>
              {editingMessage ? (
                <Textarea
                  value={orderMessage}
                  onChange={(e) => setOrderMessage(e.target.value)}
                  rows={8}
                  className="text-sm font-mono"
                />
              ) : (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-sans">{orderMessage}</pre>
                </div>
              )}
              {!selectedProveedor?.whatsapp && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Este proveedor no tiene número de WhatsApp. Edítalo para agregarlo.
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp || !selectedProveedor?.whatsapp}
              >
                <Lock className="h-4 w-4 mr-2" />
                <Send className="h-4 w-4 mr-2" />
                {sendingWhatsApp ? "Enviando..." : "Aprobar y Enviar por WhatsApp (requiere PIN)"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                <Save className="h-4 w-4 mr-2" />
                {savingOrder ? "Guardando..." : "Solo guardar orden (sin enviar)"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* PIN verification for WhatsApp send */}
      <PinVerificationDialog
        open={showSendPinDialog}
        onOpenChange={setShowSendPinDialog}
        onSuccess={handleSendWhatsAppConfirm}
        title="Autorizar Envío"
        description="Ingresa tu PIN de administración para enviar la orden por WhatsApp"
      />
    </div>
  );
};

export default ProveedoresManagement;
