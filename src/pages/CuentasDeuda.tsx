import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, ChevronDown, ChevronUp, UserPlus,
  ShoppingCart, Wallet, Receipt, AlertCircle, CheckCircle2,
  Phone, Mail, TrendingDown, TrendingUp, X, Coffee, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Cliente = {
  id: string; user_id: string; nombre: string; telefono: string | null;
  email: string | null; notas: string | null; saldo_total: number;
  estado: string; created_at: string; updated_at: string;
  tipo_cuenta: string;
};
type VentaCredito = {
  id: string; user_id: string; cliente_id: string; total: number;
  notas: string | null; created_at: string;
  detalle_ventas_credito?: DetalleItem[];
};
type DetalleItem = {
  id: string; venta_id: string; nombre_item: string;
  cantidad: number; precio_unitario: number; subtotal: number;
};
type PagoCuenta = {
  id: string; user_id: string; cliente_id: string;
  monto: number; notas: string | null; created_at: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
const COP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const fmtDate = (iso: string) =>
  format(parseISO(iso), "dd MMM yyyy · h:mm a", { locale: es });

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

// ─── Sub-components ──────────────────────────────────────────────────────────────

/** Row item for the sell-on-credit form */
function ItemRow({
  item, onChange, onRemove,
}: {
  item: { nombre: string; cantidad: string; precio: string };
  onChange: (f: Partial<typeof item>) => void;
  onRemove: () => void;
}) {
  const sub = (Number(item.cantidad) || 0) * (Number(item.precio) || 0);
  return (
    <div className="grid grid-cols-[1fr_80px_100px_80px_32px] gap-2 items-center">
      <Input
        placeholder="Producto / descripción"
        value={item.nombre}
        onChange={e => onChange({ nombre: e.target.value })}
        className="h-8 text-sm"
      />
      <Input
        type="number" placeholder="Cant." min="1"
        value={item.cantidad}
        onChange={e => onChange({ cantidad: e.target.value })}
        className="h-8 text-sm text-center"
      />
      <Input
        type="number" placeholder="Precio"
        value={item.precio}
        onChange={e => onChange({ precio: e.target.value })}
        className="h-8 text-sm"
      />
      <p className="text-xs text-right text-emerald-400 font-medium">{COP(sub)}</p>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-400"
        onClick={onRemove}><X className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────
export default function CuentasDeuda() {
  const queryClient = useQueryClient();

  // ── Dialog states
  const [clienteDialog, setClienteDialog] = useState(false);
  const [ventaDialog, setVentaDialog] = useState(false);
  const [pagoDialog, setPagoDialog] = useState(false);
  const [ajusteDialog, setAjusteDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── PIN states
  const [pinDialog, setPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinDescription, setPinDescription] = useState("Verifica tu PIN para continuar");

  // ── Forms
  const [tipoCuenta, setTipoCuenta] = useState<"cliente" | "consumo_interno">("cliente");
  const [clienteForm, setClienteForm] = useState({ nombre: "", telefono: "", email: "", notas: "", tipo_cuenta: "cliente" as string, saldo_inicial: "" });
  const [ventaItems, setVentaItems] = useState([{ nombre: "", cantidad: "1", precio: "" }]);
  const [ventaNotas, setVentaNotas] = useState("");
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoNotas, setPagoNotas] = useState("");
  const [ajusteMonto, setAjusteMonto] = useState("");
  const [ajusteNotas, setAjusteNotas] = useState("");

  // ── Queries
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes-cuenta"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase
        .from("clientes_cuenta")
        .select("*")
        .eq("user_id", uid)
        .order("saldo_total", { ascending: false });
      return (data ?? []) as Cliente[];
    },
  });

  const { data: ventas = [] } = useQuery({
    queryKey: ["ventas-credito", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ventas_credito")
        .select("*, detalle_ventas_credito(*)")
        .eq("cliente_id", expandedId!)
        .order("created_at", { ascending: false });
      return (data ?? []) as VentaCredito[];
    },
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ["pagos-cuenta", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pagos_cuenta")
        .select("*")
        .eq("cliente_id", expandedId!)
        .order("created_at", { ascending: false });
      return (data ?? []) as PagoCuenta[];
    },
  });

  // ── Mutations
  const saveCliente = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const { data: newCliente, error } = await supabase.from("clientes_cuenta").insert({
        user_id: uid,
        nombre: clienteForm.nombre,
        telefono: clienteForm.telefono || null,
        email: clienteForm.email || null,
        notas: clienteForm.notas || null,
        tipo_cuenta: clienteForm.tipo_cuenta,
      } as any).select().single();
      if (error) throw error;

      // If initial balance provided, create a ventas_credito record
      const saldoInicial = Number(clienteForm.saldo_inicial);
      if (saldoInicial > 0 && newCliente) {
        const { error: ve } = await supabase.from("ventas_credito").insert({
          user_id: uid,
          cliente_id: (newCliente as any).id,
          total: saldoInicial,
          notas: "Saldo inicial - deuda previa al sistema",
        } as any);
        if (ve) throw ve;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      setClienteDialog(false);
      setClienteForm({ nombre: "", telefono: "", email: "", notas: "", tipo_cuenta: "cliente", saldo_inicial: "" });
      toast.success("Cliente registrado");
    },
    onError: () => toast.error("Error al guardar cliente"),
  });

  const saveVenta = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error("No cliente");
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const validItems = ventaItems.filter(i => i.nombre && Number(i.precio) > 0);
      if (validItems.length === 0) throw new Error("Sin ítems");
      const total = validItems.reduce((s, i) => s + (Number(i.cantidad) || 1) * Number(i.precio), 0);

      const { data: venta, error: ve } = await supabase
        .from("ventas_credito")
        .insert({ user_id: uid, cliente_id: selectedCliente.id, total, notas: ventaNotas || null })
        .select()
        .single();
      if (ve) throw ve;

      const detalles = validItems.map(i => ({
        venta_id: venta.id,
        nombre_item: i.nombre,
        cantidad: Number(i.cantidad) || 1,
        precio_unitario: Number(i.precio),
        subtotal: (Number(i.cantidad) || 1) * Number(i.precio),
      }));
      const { error: de } = await supabase.from("detalle_ventas_credito").insert(detalles);
      if (de) throw de;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      queryClient.invalidateQueries({ queryKey: ["ventas-credito", expandedId] });
      setVentaDialog(false);
      setVentaItems([{ nombre: "", cantidad: "1", precio: "" }]);
      setVentaNotas("");
      toast.success("Venta en crédito registrada");
    },
    onError: (e: Error) => toast.error(e.message === "Sin ítems" ? "Agrega al menos un ítem con precio" : "Error al guardar"),
  });

  const savePago = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error("No cliente");
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const monto = Number(pagoMonto);
      if (!monto || monto <= 0) throw new Error("Monto inválido");
      const { error } = await supabase.from("pagos_cuenta").insert({
        user_id: uid, cliente_id: selectedCliente.id, monto, notas: pagoNotas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      queryClient.invalidateQueries({ queryKey: ["pagos-cuenta", expandedId] });
      setPagoDialog(false);
      setPagoMonto("");
      setPagoNotas("");
      toast.success("Abono registrado");
    },
    onError: (e: Error) => toast.error(e.message === "Monto inválido" ? "Ingresa un monto válido" : "Error al guardar"),
  });

  const deleteVenta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ventas_credito").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      queryClient.invalidateQueries({ queryKey: ["ventas-credito", expandedId] });
      toast.success("Venta eliminada");
    },
  });

  const deletePago = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pagos_cuenta").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      queryClient.invalidateQueries({ queryKey: ["pagos-cuenta", expandedId] });
      toast.success("Abono eliminado");
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes_cuenta").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      if (expandedId === selectedCliente?.id) setExpandedId(null);
      toast.success("Cliente eliminado");
    },
  });

  const ajusteSaldo = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid || !selectedCliente) throw new Error("No auth");
      const monto = Number(ajusteMonto);
      if (!monto || monto === 0) throw new Error("Monto inválido");

      const nota = ajusteNotas || "Ajuste manual de saldo";

      if (monto > 0) {
        // Positive = add debt via ventas_credito
        const { error } = await supabase.from("ventas_credito").insert({
          user_id: uid, cliente_id: selectedCliente.id, total: monto,
          notas: `[AJUSTE] ${nota}`,
        } as any);
        if (error) throw error;
      } else {
        // Negative = reduce debt via pagos_cuenta
        const { error } = await supabase.from("pagos_cuenta").insert({
          user_id: uid, cliente_id: selectedCliente.id, monto: Math.abs(monto),
          notas: `[AJUSTE] ${nota}`,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-cuenta"] });
      queryClient.invalidateQueries({ queryKey: ["ventas-credito", expandedId] });
      queryClient.invalidateQueries({ queryKey: ["pagos-cuenta", expandedId] });
      setAjusteDialog(false);
      setAjusteMonto("");
      setAjusteNotas("");
      toast.success("Saldo ajustado correctamente");
    },
    onError: () => toast.error("Error al ajustar saldo"),
  });

  // ── PIN helpers
  const requirePin = (description: string, action: () => void) => {
    setPinDescription(description);
    setPendingAction(() => action);
    setPinDialog(true);
  };

  const handlePinSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // ── Filter by tipo_cuenta
  const filteredClientes = clientes.filter(c => (c as any).tipo_cuenta === tipoCuenta || (!((c as any).tipo_cuenta) && tipoCuenta === "cliente"));
  const isInterno = tipoCuenta === "consumo_interno";

  // ── Aggregates (only real client accounts)
  const clientesReales = clientes.filter(c => (c as any).tipo_cuenta !== "consumo_interno");
  const totalDeuda = clientesReales.reduce((s, c) => s + (c.saldo_total > 0 ? c.saldo_total : 0), 0);
  const clientesActivos = clientesReales.filter(c => c.saldo_total > 0).length;

  // ── Aggregates for current tab
  const tabTotal = filteredClientes.reduce((s, c) => s + (c.saldo_total > 0 ? c.saldo_total : 0), 0);
  const tabActivos = filteredClientes.filter(c => c.saldo_total > 0).length;

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  const openVenta = (c: Cliente) => { setSelectedCliente(c); setVentaDialog(true); };
  const openPago  = (c: Cliente) => {
    requirePin(
      `Registrar abono para "${c.nombre}". Saldo actual: ${COP(c.saldo_total)}`,
      () => { setSelectedCliente(c); setPagoDialog(true); }
    );
  };
  const openAjuste = (c: Cliente) => {
    requirePin(
      `Ajustar manualmente el saldo de "${c.nombre}". Saldo actual: ${COP(c.saldo_total)}`,
      () => { setSelectedCliente(c); setAjusteDialog(true); }
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* ── PIN Dialog ── */}
      <PinVerificationDialog
        open={pinDialog}
        onOpenChange={setPinDialog}
        onSuccess={handlePinSuccess}
        title="Acción Protegida"
        description={pinDescription}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isInterno ? "Consumo Interno" : "Cuentas en Deuda"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isInterno
              ? <>Trazabilidad de consumo de empleados y dueños · <span className="text-blue-400 font-medium">{COP(tabTotal)} acumulado</span></>
              : <>Ventas a crédito · <span className="text-rose-400 font-medium">{COP(tabTotal)} pendiente</span>
                {tabActivos > 0 && <span className="ml-2">· {tabActivos} cliente{tabActivos > 1 ? "s" : ""} con saldo</span>}
              </>
            }
          </p>
        </div>
        <Dialog open={clienteDialog} onOpenChange={v => { setClienteDialog(v); if (v) setClienteForm(p => ({ ...p, tipo_cuenta: tipoCuenta })); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0">
              {isInterno ? <Coffee className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isInterno ? "Nueva cuenta interna" : "Nuevo cliente"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{isInterno ? "Cuenta de Consumo Interno" : "Registrar Cliente"}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">{isInterno ? "Nombre del empleado / dueño *" : "Nombre *"}</Label>
                <Input placeholder={isInterno ? "Ej: Juan (Mesero), Dueño" : "Nombre completo"} value={clienteForm.nombre}
                  onChange={e => setClienteForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input placeholder="300 000 0000" value={clienteForm.telefono}
                    onChange={e => setClienteForm(p => ({ ...p, telefono: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" placeholder="correo@ejemplo.com" value={clienteForm.email}
                    onChange={e => setClienteForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Notas</Label>
                  <Textarea rows={2} placeholder={isInterno ? "Cargo, área, etc." : "Observaciones..."} value={clienteForm.notas}
                    onChange={e => setClienteForm(p => ({ ...p, notas: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Saldo inicial</Label>
                  <Input type="number" placeholder="0" value={clienteForm.saldo_inicial}
                    onChange={e => setClienteForm(p => ({ ...p, saldo_inicial: e.target.value }))} />
                  <p className="text-[10px] text-muted-foreground">Deuda previa (opcional)</p>
                </div>
              </div>
              {isInterno && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
                  <Coffee className="h-3.5 w-3.5 inline mr-1.5" />
                  Esta cuenta es solo para trazabilidad interna. No afecta las cuentas reales ni las finanzas.
                </div>
              )}
              <Button className="w-full" onClick={() => saveCliente.mutate()}
                disabled={!clienteForm.nombre || saveCliente.isPending}>
                {saveCliente.isPending ? "Guardando..." : isInterno ? "Crear cuenta interna" : "Registrar cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tipoCuenta} onValueChange={v => { setTipoCuenta(v as any); setExpandedId(null); }}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="cliente" className="gap-1.5 text-xs">
            <Wallet className="h-3.5 w-3.5" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="consumo_interno" className="gap-1.5 text-xs">
            <Coffee className="h-3.5 w-3.5" /> Consumo Interno
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isInterno ? "Consumo total" : "Deuda total", value: COP(tabTotal), icon: isInterno ? Coffee : TrendingDown, color: isInterno ? "text-blue-400" : "text-rose-400" },
          { label: isInterno ? "Con consumo" : "Con saldo", value: String(tabActivos), icon: AlertCircle, color: "text-amber-400" },
          { label: "En cero", value: String(filteredClientes.filter(c => c.saldo_total <= 0).length), icon: CheckCircle2, color: "text-emerald-400" },
        ].map(k => (
          <Card key={k.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`h-5 w-5 shrink-0 ${k.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`font-bold text-lg leading-tight ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Client list ── */}
      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {filteredClientes.length === 0 && !isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="py-14 text-center text-muted-foreground text-sm">
            {isInterno
              ? <>No hay cuentas de consumo interno.<br />Crea una para llevar trazabilidad del consumo de empleados.</>
              : <>No hay clientes registrados aún.<br />Registra un cliente y comienza a cargar ventas en crédito.</>
            }
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filteredClientes.map(c => {
          const isOpen = expandedId === c.id;
          const hasDebt = c.saldo_total > 0;
          const isCuentaInterna = (c as any).tipo_cuenta === "consumo_interno";
          return (
            <Card key={c.id}
              className={`bg-card border transition-colors ${hasDebt ? "border-rose-500/30" : "border-border"}`}>

              {/* ── Client header row ── */}
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar letter */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${isCuentaInterna ? "bg-blue-500/15 text-blue-400" : hasDebt ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                    {isCuentaInterna ? <Coffee className="h-4 w-4" /> : c.nombre.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{c.nombre}</p>
                      <Badge variant="outline"
                        className={`text-xs ${isCuentaInterna
                          ? (hasDebt ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30")
                          : (hasDebt ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30")}`}>
                        {isCuentaInterna ? (hasDebt ? "Con consumo" : "Sin consumo") : (hasDebt ? "Con saldo" : "Al día")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.telefono && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.telefono}</span>}
                      {c.email    && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</span>}
                    </div>
                  </div>

                  {/* Saldo */}
                  <div className="text-right shrink-0 mr-2">
                    <p className="text-xs text-muted-foreground">{isCuentaInterna ? "Consumo acumulado" : "Saldo pendiente"}</p>
                    <p className={`font-bold text-lg ${isCuentaInterna ? "text-blue-400" : hasDebt ? "text-rose-400" : "text-emerald-400"}`}>
                      {COP(c.saldo_total)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline"
                      className={`h-8 gap-1 text-xs ${isCuentaInterna ? "text-blue-400 border-blue-500/30 hover:bg-blue-500/10" : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"}`}
                      onClick={() => openVenta(c)}>
                      <ShoppingCart className="h-3.5 w-3.5" /> {isCuentaInterna ? "Consumo" : "Venta"}
                    </Button>
                    {!isCuentaInterna && (
                    <Button size="sm" variant="outline"
                      className="h-8 gap-1 text-xs text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                      onClick={() => openPago(c)}>
                      <Wallet className="h-3.5 w-3.5" /> Abono
                    </Button>
                    )}
                    <Button size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                      title="Ajustar saldo"
                      onClick={() => openAjuste(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleExpand(c.id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                      onClick={() => requirePin(
                        `Eliminar cliente "${c.nombre}" y todo su historial. Esta acción no se puede deshacer.`,
                        () => deleteCliente.mutate(c.id)
                      )}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* ── Expanded history ── */}
                {isOpen && (
                  <div className="mt-4 space-y-3">
                    <Separator className="opacity-30" />

                    {/* Ventas */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" /> Ventas en crédito
                      </p>
                      {ventas.length === 0 && <p className="text-xs text-muted-foreground italic">Sin ventas registradas.</p>}
                      <div className="space-y-2">
                        {ventas.map(v => (
                          <div key={v.id}
                            className="rounded-lg border border-border bg-muted/20 p-3 flex gap-3 items-start">
                            <TrendingDown className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">{fmtDate(v.created_at)}</p>
                                <p className="font-bold text-sm text-rose-400">{COP(v.total)}</p>
                              </div>
                              {v.notas && <p className="text-xs text-muted-foreground mt-0.5 italic">{v.notas}</p>}
                              {/* Items */}
                              {v.detalle_ventas_credito && v.detalle_ventas_credito.length > 0 && (
                                <div className="mt-2 space-y-0.5">
                                  {v.detalle_ventas_credito.map(d => (
                                    <div key={d.id} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        {d.cantidad > 1 ? `${d.cantidad}× ` : ""}{d.nombre_item}
                                      </span>
                                      <span className="text-foreground/70">{COP(d.subtotal)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-400 shrink-0"
                              onClick={() => requirePin(
                                `Eliminar venta de ${COP(v.total)} del ${fmtDate(v.created_at)}. El saldo del cliente se recalculará.`,
                                () => deleteVenta.mutate(v.id)
                              )}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pagos */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5" /> Abonos y pagos
                      </p>
                      {pagos.length === 0 && <p className="text-xs text-muted-foreground italic">Sin abonos registrados.</p>}
                      <div className="space-y-2">
                        {pagos.map(p => (
                          <div key={p.id}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-3 items-start">
                            <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</p>
                                <p className="font-bold text-sm text-emerald-400">+ {COP(p.monto)}</p>
                              </div>
                              {p.notas && <p className="text-xs text-muted-foreground mt-0.5 italic">{p.notas}</p>}
                            </div>
                            <Button size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-400 shrink-0"
                              onClick={() => requirePin(
                                `Eliminar abono de ${COP(p.monto)}. El saldo del cliente aumentará nuevamente.`,
                                () => deletePago.mutate(p.id)
                              )}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Dialog: Venta en crédito ── */}
      <Dialog open={ventaDialog} onOpenChange={v => { setVentaDialog(v); if (!v) { setVentaItems([{ nombre: "", cantidad: "1", precio: "" }]); setVentaNotas(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isInterno ? <Coffee className="h-4 w-4 text-blue-400" /> : <ShoppingCart className="h-4 w-4 text-emerald-400" />}
              {isInterno ? "Registrar Consumo" : "Venta en Crédito"} — {selectedCliente?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_100px_80px_32px] gap-2">
              {["Ítem", "Cant.", "Precio", "Total", ""].map(h => (
                <p key={h} className="text-xs text-muted-foreground font-medium">{h}</p>
              ))}
            </div>

            {ventaItems.map((item, idx) => (
              <ItemRow
                key={idx}
                item={item}
                onChange={f => setVentaItems(p => p.map((r, i) => i === idx ? { ...r, ...f } : r))}
                onRemove={() => setVentaItems(p => p.filter((_, i) => i !== idx))}
              />
            ))}

            <Button size="sm" variant="outline" className="gap-1.5 text-xs"
              onClick={() => setVentaItems(p => [...p, { nombre: "", cantidad: "1", precio: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Agregar ítem
            </Button>

            <Separator className="opacity-30" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Total a cargar</p>
              <p className="text-xl font-bold text-emerald-400">
                {COP(ventaItems.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precio) || 0), 0))}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notas (opcional)</Label>
              <Textarea rows={2} placeholder="Referencia, detalle adicional..." value={ventaNotas}
                onChange={e => setVentaNotas(e.target.value)} />
            </div>

            <Button className="w-full"
              onClick={() => requirePin(
                `${isInterno ? "Registrar consumo interno" : "Registrar venta en crédito"} a "${selectedCliente?.nombre}" por ${COP(ventaItems.reduce((s, i) => s + (Number(i.cantidad)||0)*(Number(i.precio)||0), 0))}`,
                () => saveVenta.mutate()
              )}
              disabled={saveVenta.isPending}>
              {saveVenta.isPending ? "Registrando..." : isInterno ? "Registrar consumo" : "Registrar venta en crédito"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Abono / Pago ── */}
      <Dialog open={pagoDialog} onOpenChange={v => { setPagoDialog(v); if (!v) { setPagoMonto(""); setPagoNotas(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-400" />
              Registrar Abono — {selectedCliente?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {selectedCliente && selectedCliente.saldo_total > 0 && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Saldo actual</p>
                <p className="font-bold text-rose-400 text-xl">{COP(selectedCliente.saldo_total)}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Monto abonado *</Label>
              <Input type="number" placeholder="0" value={pagoMonto}
                onChange={e => setPagoMonto(e.target.value)} className="text-lg font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Textarea rows={2} placeholder="Forma de pago, referencia..." value={pagoNotas}
                onChange={e => setPagoNotas(e.target.value)} />
            </div>
            {pagoMonto && selectedCliente && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm flex justify-between">
                <p className="text-xs text-muted-foreground">Saldo después del abono</p>
                <p className={`font-bold ${selectedCliente.saldo_total - Number(pagoMonto) <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {COP(Math.max(0, selectedCliente.saldo_total - Number(pagoMonto)))}
                </p>
              </div>
            )}
            <Button className="w-full"
              onClick={() => requirePin(
                `Confirmar abono de ${COP(Number(pagoMonto))} para "${selectedCliente?.nombre}". Saldo quedará en ${COP(Math.max(0, (selectedCliente?.saldo_total ?? 0) - Number(pagoMonto)))}`,
                () => savePago.mutate()
              )}
              disabled={!pagoMonto || savePago.isPending}>
              {savePago.isPending ? "Registrando..." : "Registrar abono"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
