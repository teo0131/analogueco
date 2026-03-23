import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

type CuentaCobrar = {
  id: string; user_id: string; cliente_nombre: string; concepto: string;
  monto: number; fecha_emision: string; fecha_vencimiento: string | null;
  estado: string; notas: string | null; created_at: string;
};

const COP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cobrado:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    vencido:   "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };
  return map[estado] ?? "bg-muted text-muted-foreground";
};

export default function CuentasPorCobrar() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [form, setForm] = useState({
    cliente_nombre: "", concepto: "", monto: "", fecha_vencimiento: "", notas: "",
  });

  // PIN state
  const [pinDialog, setPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinDescription, setPinDescription] = useState("");

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ["cuentas-cobrar"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase.from("cuentas_por_cobrar").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      return (data ?? []) as CuentaCobrar[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const { error } = await supabase.from("cuentas_por_cobrar").insert({
        user_id: uid, cliente_nombre: form.cliente_nombre, concepto: form.concepto,
        monto: Number(form.monto), fecha_vencimiento: form.fecha_vencimiento || null,
        notas: form.notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas-cobrar"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-cxc-kpi"] });
      setDialogOpen(false);
      setForm({ cliente_nombre: "", concepto: "", monto: "", fecha_vencimiento: "", notas: "" });
      toast.success("Cuenta registrada");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("cuentas_por_cobrar").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas-cobrar"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-cxc-kpi"] });
    },
  });

  const deleteCuenta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cuentas_por_cobrar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas-cobrar"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-cxc-kpi"] });
      toast.success("Eliminado");
    },
  });

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

  const filtered = filtroEstado === "todos" ? lista : lista.filter(c => c.estado === filtroEstado);
  const totalPendiente = lista.filter(c => c.estado === "pendiente").reduce((s, c) => s + c.monto, 0);
  const vencidas = lista.filter(c => c.estado === "vencido").length;

  const diasParaVencer = (fecha: string | null) => {
    if (!fecha) return null;
    return differenceInDays(parseISO(fecha), startOfDay(new Date()));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <PinVerificationDialog
        open={pinDialog}
        onOpenChange={setPinDialog}
        onSuccess={handlePinSuccess}
        title="Acción Protegida"
        description={pinDescription}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cuentas por Cobrar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {COP(totalPendiente)} por cobrar · {lista.filter(c => c.estado === "pendiente").length} cuentas
            {vencidas > 0 && <span className="text-rose-400 ml-2">· {vencidas} vencida{vencidas > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="cobrado">Cobrado</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nueva cuenta</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Cuenta por Cobrar</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cliente *</Label>
                    <Input placeholder="Nombre del cliente" value={form.cliente_nombre} onChange={e => setForm(p => ({ ...p, cliente_nombre: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monto *</Label>
                    <Input type="number" placeholder="0" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Concepto *</Label>
                  <Input placeholder="Ej: Anticipo evento, Crédito venta" value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha de vencimiento</Label>
                  <Input type="date" value={form.fecha_vencimiento} onChange={e => setForm(p => ({ ...p, fecha_vencimiento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notas</Label>
                  <Textarea rows={2} placeholder="Detalles adicionales..." value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => save.mutate()} disabled={!form.cliente_nombre || !form.monto || !form.concepto || save.isPending}>
                  {save.isPending ? "Guardando..." : "Guardar cuenta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista */}
      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {filtered.length === 0 && !isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No hay cuentas {filtroEstado !== "todos" ? `con estado "${filtroEstado}"` : "registradas"}.<br />
            Registra anticipos, créditos o deudas de clientes.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(c => {
          const dias = diasParaVencer(c.fecha_vencimiento);
          return (
            <Card key={c.id} className={`bg-card border-border ${c.estado === "vencido" ? "border-rose-500/30" : ""}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{c.cliente_nombre}</p>
                    <Badge variant="outline" className={`text-xs ${estadoBadge(c.estado)}`}>{c.estado}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.concepto}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-muted-foreground">Emitido: {format(parseISO(c.fecha_emision), "dd/MM/yyyy")}</p>
                    {dias !== null && (
                      <p className={`text-xs flex items-center gap-1 ${dias <= 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {dias <= 0 && <AlertCircle className="h-3 w-3" />}
                        {dias <= 0 ? "Vencido" : `Vence en ${dias} días`}
                      </p>
                    )}
                  </div>
                  {c.notas && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.notas}</p>}
                </div>
                <div className="text-right shrink-0 mr-2">
                  <p className="font-bold text-emerald-400">{COP(c.monto)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.estado !== "cobrado" && (
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      title="Marcar como cobrado"
                      onClick={() => requirePin(
                        `Marcar como cobrado "${c.concepto}" de ${c.cliente_nombre} por ${COP(c.monto)}.`,
                        () => updateEstado.mutate({ id: c.id, estado: "cobrado" })
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  {c.estado === "cobrado" && (
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                      title="Marcar como pendiente"
                      onClick={() => requirePin(
                        `Revertir el cobro de "${c.concepto}" a pendiente.`,
                        () => updateEstado.mutate({ id: c.id, estado: "pendiente" })
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon" variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => requirePin(
                      `Eliminar cuenta de ${c.cliente_nombre} por ${COP(c.monto)} permanentemente.`,
                      () => deleteCuenta.mutate(c.id)
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
