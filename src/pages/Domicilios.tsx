import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import {
  Bike, Clock, CheckCircle2, Truck, Package, XCircle, Plus, MapPin,
  Phone, User, ShoppingBag, ChevronRight, AlertCircle, MessageCircle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ─────────────────────────────────────────────────────────────────────
type EstadoDomicilio = "pendiente" | "aprobado" | "preparando" | "en_camino" | "entregado" | "cancelado";

interface DetalleDomicilio {
  id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
}

interface Domicilio {
  id: string;
  user_id: string;
  nombre_cliente: string;
  telefono_cliente?: string;
  direccion_entrega: string;
  notas_cliente?: string;
  canal: string;
  estado: EstadoDomicilio;
  repartidor?: string;
  tiempo_estimado_min?: number;
  total: number;
  metodo_pago?: string;
  pagado: boolean;
  created_at: string;
  aprobado_at?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const ESTADOS: { key: EstadoDomicilio; label: string; color: string; icon: React.ElementType }[] = [
  { key: "pendiente",   label: "Pendientes",  color: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",   icon: Clock },
  { key: "aprobado",    label: "Aprobados",   color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",        icon: CheckCircle2 },
  { key: "preparando",  label: "Preparando",  color: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400",icon: Package },
  { key: "en_camino",   label: "En Camino",   color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",    icon: Truck },
  { key: "entregado",   label: "Entregados",  color: "bg-muted border-border text-muted-foreground",                              icon: CheckCircle2 },
  { key: "cancelado",   label: "Cancelados",  color: "bg-destructive/10 border-destructive/30 text-destructive",                  icon: XCircle },
];

const BADGE_VARIANT: Record<EstadoDomicilio, string> = {
  pendiente: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  aprobado: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  preparando: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  en_camino: "bg-green-500/20 text-green-700 dark:text-green-400",
  entregado: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/20 text-destructive",
};

const ESTADO_LABEL: Record<EstadoDomicilio, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  preparando: "Preparando",
  en_camino: "En Camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// ── Empty form ─────────────────────────────────────────────────────────────────
const emptyForm = {
  nombre_cliente: "",
  telefono_cliente: "",
  direccion_entrega: "",
  notas_cliente: "",
  metodo_pago: "efectivo",
  tiempo_estimado_min: "",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Domicilios() {
  const queryClient = useQueryClient();

  const [selectedDomicilio, setSelectedDomicilio] = useState<Domicilio | null>(null);
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinAction, setPinAction] = useState<{ type: "aprobar" | "cancelar"; domicilioId: string } | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [activeFilter, setActiveFilter] = useState<EstadoDomicilio | "todos">("todos");

  // Items del nuevo pedido
  const [newItems, setNewItems] = useState<{ nombre: string; cantidad: number; precio: number }[]>([
    { nombre: "", cantidad: 1, precio: 0 },
  ]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: domicilios = [], isLoading, refetch } = useQuery({
    queryKey: ["domicilios"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("domicilios")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Domicilio[];
    },
    refetchInterval: 15000,
  });

  const { data: detalles = [] } = useQuery({
    queryKey: ["detalle-domicilios", selectedDomicilio?.id],
    enabled: !!selectedDomicilio,
    queryFn: async () => {
      if (!selectedDomicilio) return [];
      const { data, error } = await supabase
        .from("detalle_domicilios")
        .select("*")
        .eq("domicilio_id", selectedDomicilio.id);
      if (error) throw error;
      return data as DetalleDomicilio[];
    },
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items-active"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("menu_items")
        .select("id, nombre, precio, categoria")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .order("nombre");
      return data ?? [];
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado, extra }: { id: string; estado: EstadoDomicilio; extra?: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const update: Record<string, unknown> = { estado, ...extra };
      if (estado === "aprobado") update.aprobado_at = new Date().toISOString();
      if (estado === "entregado") update.entregado_at = new Date().toISOString();
      const { error } = await supabase.from("domicilios").update(update).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domicilios"] });
      toast.success("Estado actualizado");
      if (selectedDomicilio) setSelectedDomicilio((prev) => prev ? { ...prev, estado: pinAction?.type === "aprobar" ? "aprobado" : "cancelado" } : null);
    },
    onError: () => toast.error("Error al actualizar estado"),
  });

  const createDomicilioMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const validItems = newItems.filter((i) => i.nombre.trim());
      const total = validItems.reduce((s, i) => s + i.precio * i.cantidad, 0);
      const { data: dom, error: domErr } = await supabase
        .from("domicilios")
        .insert({
          user_id: user.id,
          nombre_cliente: formData.nombre_cliente,
          telefono_cliente: formData.telefono_cliente || null,
          direccion_entrega: formData.direccion_entrega,
          notas_cliente: formData.notas_cliente || null,
          metodo_pago: formData.metodo_pago,
          tiempo_estimado_min: formData.tiempo_estimado_min ? Number(formData.tiempo_estimado_min) : null,
          total,
          canal: "manual",
        })
        .select("id")
        .single();
      if (domErr) throw domErr;
      if (validItems.length) {
        const detalles = validItems.map((i) => ({
          domicilio_id: dom.id,
          nombre_item: i.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio,
          subtotal: i.precio * i.cantidad,
        }));
        await supabase.from("detalle_domicilios").insert(detalles);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domicilios"] });
      toast.success("Domicilio creado");
      setShowNewSheet(false);
      setFormData(emptyForm);
      setNewItems([{ nombre: "", cantidad: 1, precio: 0 }]);
    },
    onError: () => toast.error("Error al crear domicilio"),
  });

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = activeFilter === "todos" ? domicilios : domicilios.filter((d) => d.estado === activeFilter);

  const countByEstado = (e: EstadoDomicilio) => domicilios.filter((d) => d.estado === e).length;
  const pendingCount = countByEstado("pendiente");

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAprobar = (id: string) => {
    setPinAction({ type: "aprobar", domicilioId: id });
    setShowPinDialog(true);
  };

  const handleCancelar = (id: string) => {
    setPinAction({ type: "cancelar", domicilioId: id });
    setShowPinDialog(true);
  };

  const handlePinSuccess = () => {
    if (!pinAction) return;
    updateEstadoMutation.mutate({
      id: pinAction.domicilioId,
      estado: pinAction.type === "aprobar" ? "aprobado" : "cancelado",
    });
    setShowPinDialog(false);
    setPinAction(null);
  };

  const handleAvanzarEstado = (domicilio: Domicilio) => {
    const flow: EstadoDomicilio[] = ["aprobado", "preparando", "en_camino", "entregado"];
    const idx = flow.indexOf(domicilio.estado);
    if (idx === -1 || idx === flow.length - 1) return;
    updateEstadoMutation.mutate({ id: domicilio.id, estado: flow[idx + 1] });
  };

  const nextLabel: Partial<Record<EstadoDomicilio, string>> = {
    aprobado: "→ Preparando",
    preparando: "→ En Camino",
    en_camino: "→ Entregado",
  };

  // ── Item helpers ───────────────────────────────────────────────────────────
  const updateItem = (idx: number, field: string, value: string | number) => {
    setNewItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const addItem = () => setNewItems((prev) => [...prev, { nombre: "", cantidad: 1, precio: 0 }]);
  const removeItem = (idx: number) => setNewItems((prev) => prev.filter((_, i) => i !== idx));

  const totalNuevoPedido = newItems.reduce((s, i) => s + i.precio * i.cantidad, 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bike className="h-6 w-6 text-primary" />
            Domicilios
            {pendingCount > 0 && (
              <span className="ml-2 text-sm bg-amber-500 text-white rounded-full px-2 py-0.5 font-semibold">
                {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">Gestión de pedidos a domicilio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button onClick={() => setShowNewSheet(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo Domicilio
          </Button>
        </div>
      </div>

      {/* Estado badges filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter("todos")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeFilter === "todos" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          Todos ({domicilios.length})
        </button>
        {ESTADOS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeFilter === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label} ({countByEstado(key)})
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando domicilios...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bike className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No hay domicilios {activeFilter !== "todos" ? `con estado "${ESTADO_LABEL[activeFilter as EstadoDomicilio]}"` : "aún"}</p>
          {activeFilter === "todos" && (
            <Button className="mt-4" onClick={() => setShowNewSheet(true)}>
              <Plus className="h-4 w-4 mr-1" /> Crear primer domicilio
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((dom) => (
            <Card
              key={dom.id}
              className="cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => setSelectedDomicilio(dom)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{dom.nombre_cliente}</p>
                    {dom.telefono_cliente && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{dom.telefono_cliente}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_VARIANT[dom.estado]}`}>
                      {ESTADO_LABEL[dom.estado]}
                    </span>
                    {dom.canal === "whatsapp" && (
                      <span className="text-xs flex items-center gap-0.5 text-green-600">
                        <MessageCircle className="h-3 w-3" /> WA
                      </span>
                    )}
                  </div>
                </div>
                {/* Address */}
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {dom.direccion_entrega}
                </p>
                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="font-bold text-sm">${dom.total.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(dom.created_at), "HH:mm", { locale: es })}
                  </span>
                </div>
                {/* Quick actions */}
                {dom.estado === "pendiente" && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => handleAprobar(dom.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/40" onClick={() => handleCancelar(dom.id)}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                    </Button>
                  </div>
                )}
                {nextLabel[dom.estado] && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleAvanzarEstado(dom); }}
                  >
                    <ChevronRight className="h-3.5 w-3.5 mr-1" />
                    {nextLabel[dom.estado]}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedDomicilio} onOpenChange={(o) => !o && setSelectedDomicilio(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedDomicilio && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5 text-primary" />
                  Detalle del Domicilio
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${BADGE_VARIANT[selectedDomicilio.estado]}`}>
                    {ESTADO_LABEL[selectedDomicilio.estado]}
                  </span>
                  {selectedDomicilio.canal === "whatsapp" && (
                    <span className="text-xs flex items-center gap-1 text-green-600">
                      <MessageCircle className="h-4 w-4" /> Pedido por WhatsApp
                    </span>
                  )}
                </div>
                <Separator />
                {/* Cliente */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedDomicilio.nombre_cliente}</span>
                  </div>
                  {selectedDomicilio.telefono_cliente && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedDomicilio.telefono_cliente}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{selectedDomicilio.direccion_entrega}</span>
                  </div>
                  {selectedDomicilio.notas_cliente && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-muted-foreground">{selectedDomicilio.notas_cliente}</span>
                    </div>
                  )}
                </div>
                <Separator />
                {/* Items */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pedido</p>
                  {detalles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin ítems registrados</p>
                  ) : (
                    <div className="space-y-1">
                      {detalles.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                          <span>{d.cantidad}x {d.nombre_item}</span>
                          <span className="font-medium">${d.subtotal.toLocaleString()}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between font-bold">
                        <span>Total</span>
                        <span>${selectedDomicilio.total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Info adicional */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Pago</p>
                    <p className="capitalize">{selectedDomicilio.metodo_pago ?? "Efectivo"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado pago</p>
                    <p>{selectedDomicilio.pagado ? "✅ Pagado" : "⏳ Pendiente"}</p>
                  </div>
                  {selectedDomicilio.repartidor && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Repartidor</p>
                      <p>{selectedDomicilio.repartidor}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p>{format(new Date(selectedDomicilio.created_at), "PPpp", { locale: es })}</p>
                  </div>
                </div>
                <Separator />
                {/* Actions */}
                <div className="space-y-2">
                  {selectedDomicilio.estado === "pendiente" && (
                    <>
                      <Button className="w-full" onClick={() => handleAprobar(selectedDomicilio.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar Domicilio (requiere PIN)
                      </Button>
                      <Button variant="outline" className="w-full text-destructive border-destructive/40" onClick={() => handleCancelar(selectedDomicilio.id)}>
                        <XCircle className="h-4 w-4 mr-2" /> Cancelar (requiere PIN)
                      </Button>
                    </>
                  )}
                  {nextLabel[selectedDomicilio.estado] && (
                    <Button variant="outline" className="w-full" onClick={() => handleAvanzarEstado(selectedDomicilio)}>
                      <ChevronRight className="h-4 w-4 mr-2" /> {nextLabel[selectedDomicilio.estado]}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Domicilio Sheet */}
      <Sheet open={showNewSheet} onOpenChange={setShowNewSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Nuevo Domicilio Manual
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Nombre del cliente *</Label>
              <Input value={formData.nombre_cliente} onChange={(e) => setFormData((p) => ({ ...p, nombre_cliente: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={formData.telefono_cliente} onChange={(e) => setFormData((p) => ({ ...p, telefono_cliente: e.target.value }))} placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-2">
              <Label>Dirección de entrega *</Label>
              <Textarea value={formData.direccion_entrega} onChange={(e) => setFormData((p) => ({ ...p, direccion_entrega: e.target.value }))} placeholder="Calle, barrio, ciudad..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={formData.metodo_pago} onValueChange={(v) => setFormData((p) => ({ ...p, metodo_pago: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tiempo estimado (min)</Label>
                <Input type="number" value={formData.tiempo_estimado_min} onChange={(e) => setFormData((p) => ({ ...p, tiempo_estimado_min: e.target.value }))} placeholder="30" />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ítems del pedido</Label>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" /> Agregar</Button>
              </div>
              {newItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Select value={item.nombre} onValueChange={(v) => {
                      const found = menuItems.find((m: any) => m.nombre === v);
                      updateItem(idx, "nombre", v);
                      if (found) updateItem(idx, "precio", found.precio);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar del menú..." /></SelectTrigger>
                      <SelectContent>
                        {menuItems.map((m: any) => (
                          <SelectItem key={m.id} value={m.nombre}>{m.nombre} — ${m.precio}</SelectItem>
                        ))}
                        <SelectItem value="__custom__">Otro (escribir)</SelectItem>
                      </SelectContent>
                    </Select>
                    {(item.nombre === "__custom__" || !menuItems.some((m: any) => m.nombre === item.nombre)) && item.nombre !== "" && (
                      <Input placeholder="Nombre del ítem" value={item.nombre === "__custom__" ? "" : item.nombre} onChange={(e) => updateItem(idx, "nombre", e.target.value)} />
                    )}
                  </div>
                  <Input type="number" className="w-16" value={item.cantidad} min={1} onChange={(e) => updateItem(idx, "cantidad", Number(e.target.value))} />
                  <Input type="number" className="w-24" value={item.precio} placeholder="$" onChange={(e) => updateItem(idx, "precio", Number(e.target.value))} />
                  {newItems.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeItem(idx)}><XCircle className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm pt-2 border-t">
                <span>Total estimado</span>
                <span>${totalNuevoPedido.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea value={formData.notas_cliente} onChange={(e) => setFormData((p) => ({ ...p, notas_cliente: e.target.value }))} placeholder="Instrucciones especiales, apartamento, etc." rows={2} />
            </div>
            <Button
              className="w-full"
              disabled={!formData.nombre_cliente.trim() || !formData.direccion_entrega.trim() || createDomicilioMutation.isPending}
              onClick={() => createDomicilioMutation.mutate()}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {createDomicilioMutation.isPending ? "Creando..." : "Crear Domicilio"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* PIN Dialog */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinSuccess}
        title={pinAction?.type === "aprobar" ? "Aprobar Domicilio" : "Cancelar Domicilio"}
        description={`Ingresa tu PIN para ${pinAction?.type === "aprobar" ? "aprobar" : "cancelar"} este domicilio`}
      />
    </div>
  );
}
