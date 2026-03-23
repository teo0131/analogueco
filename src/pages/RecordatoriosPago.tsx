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
import { Plus, CheckCircle2, Trash2, Bell, ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";

type Recordatorio = {
  id: string; user_id: string; cuenta_id: string | null; tipo: string;
  titulo: string; descripcion: string | null; monto: number | null;
  fecha_recordatorio: string; estado: string; created_at: string;
};

const COP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    pendiente:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
    completado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ignorado:   "bg-muted text-muted-foreground border-muted",
  };
  return map[estado] ?? "bg-muted text-muted-foreground";
};

export default function RecordatoriosPago() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtro, setFiltro] = useState("pendiente");
  const [form, setForm] = useState({
    titulo: "", tipo: "general", descripcion: "", monto: "", fecha_recordatorio: "",
  });

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ["recordatorios"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase.from("recordatorios_pago").select("*").eq("user_id", uid).order("fecha_recordatorio", { ascending: true });
      return (data ?? []) as Recordatorio[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const { error } = await supabase.from("recordatorios_pago").insert({
        user_id: uid, titulo: form.titulo, tipo: form.tipo,
        descripcion: form.descripcion || null,
        monto: form.monto ? Number(form.monto) : null,
        fecha_recordatorio: form.fecha_recordatorio,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordatorios"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-rec-kpi"] });
      setDialogOpen(false);
      setForm({ titulo: "", tipo: "general", descripcion: "", monto: "", fecha_recordatorio: "" });
      toast.success("Recordatorio creado");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("recordatorios_pago").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordatorios"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-rec-kpi"] });
    },
  });

  const deleteRec = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recordatorios_pago").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordatorios"] });
      queryClient.invalidateQueries({ queryKey: ["finanzas-rec-kpi"] });
      toast.success("Eliminado");
    },
  });

  const filtered = filtro === "todos" ? lista : lista.filter(r => r.estado === filtro);
  const pendientes = lista.filter(r => r.estado === "pendiente").length;

  const diasParaVencer = (fecha: string) =>
    differenceInDays(parseISO(fecha), startOfDay(new Date()));

  const tipoIcon = (tipo: string) => {
    if (tipo === "pagar") return <ArrowDownCircle className="h-4 w-4 text-amber-400 shrink-0" />;
    if (tipo === "cobrar") return <ArrowUpCircle className="h-4 w-4 text-emerald-400 shrink-0" />;
    return <Bell className="h-4 w-4 text-blue-400 shrink-0" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recordatorios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pendientes} pendiente{pendientes !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="ignorado">Ignorado</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nuevo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Nuevo Recordatorio</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Título *</Label>
                  <Input placeholder="Ej: Pagar arriendo, Cobrar a Juan" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pagar">Pagar</SelectItem>
                        <SelectItem value="cobrar">Cobrar</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monto (opcional)</Label>
                    <Input type="number" placeholder="0" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha *</Label>
                  <Input type="date" value={form.fecha_recordatorio} onChange={e => setForm(p => ({ ...p, fecha_recordatorio: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descripción</Label>
                  <Textarea rows={2} placeholder="Detalles adicionales..." value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => save.mutate()} disabled={!form.titulo || !form.fecha_recordatorio || save.isPending}>
                  {save.isPending ? "Guardando..." : "Crear recordatorio"}
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
            Sin recordatorios {filtro !== "todos" ? `"${filtro}"` : ""}.<br />
            Crea alertas para pagos, cobros o cualquier evento financiero.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const dias = diasParaVencer(r.fecha_recordatorio);
          return (
            <Card key={r.id} className={`bg-card border-border transition-opacity ${r.estado === "completado" || r.estado === "ignorado" ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-3">
                {tipoIcon(r.tipo)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{r.titulo}</p>
                    <Badge variant="outline" className={`text-xs ${estadoBadge(r.estado)}`}>{r.estado}</Badge>
                  </div>
                  {r.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{r.descripcion}</p>}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className={`text-xs ${dias <= 0 ? "text-rose-400" : dias <= 3 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {format(parseISO(r.fecha_recordatorio), "dd/MM/yyyy")}
                      {dias <= 0 ? " · Vencido" : dias <= 7 ? ` · ${dias}d` : ""}
                    </p>
                  </div>
                </div>
                {r.monto && <p className="font-semibold text-sm shrink-0">{COP(r.monto)}</p>}
                <div className="flex items-center gap-1 shrink-0">
                  {r.estado === "pendiente" && (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10" title="Completar" onClick={() => updateEstado.mutate({ id: r.id, estado: "completado" })}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10" onClick={() => deleteRec.mutate(r.id)}>
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
