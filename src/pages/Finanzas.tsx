import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Bell,
  CreditCard, AlertCircle, CheckCircle2, Clock, Trash2,
  ArrowUpCircle, ArrowDownCircle, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay, parseISO, isAfter, isBefore, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ────────────────────────────────────────────────────────────────────

type CuentaPagar = {
  id: string; user_id: string; nombre: string; categoria: string;
  monto: number; periodicidad: string; dia_vencimiento: number | null;
  fecha_vencimiento: string | null; estado: string; proveedor: string | null;
  notas: string | null; es_recurrente: boolean; created_at: string;
};

type CuentaCobrar = {
  id: string; user_id: string; cliente_nombre: string; concepto: string;
  monto: number; fecha_emision: string; fecha_vencimiento: string | null;
  estado: string; notas: string | null; created_at: string;
};

type Recordatorio = {
  id: string; user_id: string; cuenta_id: string | null; tipo: string;
  titulo: string; descripcion: string | null; monto: number | null;
  fecha_recordatorio: string; estado: string; created_at: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS_CXP = [
  "Arriendo", "Servicios públicos", "Internet", "Nómina",
  "Seguros", "Préstamo", "Mantenimiento", "Marketing", "Otros",
];

const PERIODICIDADES = [
  { value: "mensual",    label: "Mensual" },
  { value: "quincenal",  label: "Quincenal" },
  { value: "semanal",    label: "Semanal" },
  { value: "anual",      label: "Anual" },
  { value: "unico",      label: "Pago único" },
];

const COP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const ingresos = payload.find((p: any) => p.dataKey === "ingresos")?.value ?? 0;
  const egresos  = payload.find((p: any) => p.dataKey === "egresos")?.value ?? 0;
  const neto = ingresos - egresos;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      <p className="text-emerald-400">▲ Ingresos: {COP(ingresos)}</p>
      <p className="text-rose-400">▼ Egresos: {COP(egresos)}</p>
      <div className="border-t border-border mt-1.5 pt-1.5">
        <p className={neto >= 0 ? "text-blue-400 font-semibold" : "text-orange-400 font-semibold"}>
          Neto: {COP(neto)}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function Finanzas() {
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d">("30d");
  const [tabActiva, setTabActiva] = useState("flujo");

  // ── Dialogs ─────────────────────────────────────────────────────────────────
  const [dialogCxP, setDialogCxP] = useState(false);
  const [dialogCxC, setDialogCxC] = useState(false);
  const [dialogRecordatorio, setDialogRecordatorio] = useState(false);

  // ── Forms ───────────────────────────────────────────────────────────────────
  const [formCxP, setFormCxP] = useState({
    nombre: "", categoria: "Otros", monto: "", periodicidad: "mensual",
    dia_vencimiento: "", fecha_vencimiento: "", proveedor: "", notas: "",
    es_recurrente: true,
  });
  const [formCxC, setFormCxC] = useState({
    cliente_nombre: "", concepto: "", monto: "",
    fecha_vencimiento: "", notas: "",
  });
  const [formRec, setFormRec] = useState({
    titulo: "", tipo: "general", descripcion: "", monto: "", fecha_recordatorio: "",
  });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const diasPeriodo = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;

  const { data: ventasPeriodo = [] } = useQuery({
    queryKey: ["finanzas-ventas", periodo],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const desde = format(subDays(new Date(), diasPeriodo), "yyyy-MM-dd");
      const { data } = await supabase
        .from("ordenes_pos")
        .select("total, fecha")
        .eq("user_id", uid)
        .gte("fecha", desde);
      return data ?? [];
    },
  });

  const { data: gastosPeriodo = [] } = useQuery({
    queryKey: ["finanzas-gastos", periodo],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const desde = format(subDays(new Date(), diasPeriodo), "yyyy-MM-dd");
      const { data } = await supabase
        .from("gastos_operativos")
        .select("monto, fecha")
        .eq("user_id", uid)
        .gte("fecha", desde);
      return data ?? [];
    },
  });

  const { data: cxpList = [], isLoading: loadingCxP } = useQuery({
    queryKey: ["cuentas-pagar"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase
        .from("cuentas_por_pagar")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      return (data ?? []) as CuentaPagar[];
    },
  });

  const { data: cxcList = [], isLoading: loadingCxC } = useQuery({
    queryKey: ["cuentas-cobrar"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase
        .from("cuentas_por_cobrar")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      return (data ?? []) as CuentaCobrar[];
    },
  });

  const { data: recordatorios = [] } = useQuery({
    queryKey: ["recordatorios"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase
        .from("recordatorios_pago")
        .select("*")
        .eq("user_id", uid)
        .order("fecha_recordatorio", { ascending: true });
      return (data ?? []) as Recordatorio[];
    },
  });

  // ── Chart data ────────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const days: Record<string, { fecha: string; ingresos: number; egresos: number }> = {};
    for (let i = diasPeriodo - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd/MM");
      days[d] = { fecha: d, ingresos: 0, egresos: 0 };
    }
    ventasPeriodo.forEach((v: any) => {
      const d = format(parseISO(v.fecha), "dd/MM");
      if (days[d]) days[d].ingresos += Number(v.total);
    });
    gastosPeriodo.forEach((g: any) => {
      const d = format(parseISO(g.fecha), "dd/MM");
      if (days[d]) days[d].egresos += Number(g.monto);
    });
    return Object.values(days);
  }, [ventasPeriodo, gastosPeriodo, diasPeriodo]);

  const totalIngresos = chartData.reduce((s, d) => s + d.ingresos, 0);
  const totalEgresos  = chartData.reduce((s, d) => s + d.egresos, 0);
  const neto = totalIngresos - totalEgresos;

  // ── KPIs CxP/CxC ─────────────────────────────────────────────────────────────

  const totalCxP       = cxpList.filter(c => c.estado === "pendiente").reduce((s, c) => s + c.monto, 0);
  const totalCxC       = cxcList.filter(c => c.estado === "pendiente").reduce((s, c) => s + c.monto, 0);
  const cxpVencidas    = cxpList.filter(c => c.estado === "vencido").length;
  const cxcVencidas    = cxcList.filter(c => c.estado === "vencido").length;
  const recordsPend    = recordatorios.filter(r => r.estado === "pendiente").length;

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const saveCxP = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const { error } = await supabase.from("cuentas_por_pagar").insert({
        user_id: uid,
        nombre: formCxP.nombre,
        categoria: formCxP.categoria,
        monto: Number(formCxP.monto),
        periodicidad: formCxP.periodicidad,
        dia_vencimiento: formCxP.dia_vencimiento ? Number(formCxP.dia_vencimiento) : null,
        fecha_vencimiento: formCxP.fecha_vencimiento || null,
        proveedor: formCxP.proveedor || null,
        notas: formCxP.notas || null,
        es_recurrente: formCxP.es_recurrente,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas-pagar"] });
      setDialogCxP(false);
      setFormCxP({ nombre: "", categoria: "Otros", monto: "", periodicidad: "mensual", dia_vencimiento: "", fecha_vencimiento: "", proveedor: "", notas: "", es_recurrente: true });
      toast.success("Cuenta por pagar registrada");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const saveCxC = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const { error } = await supabase.from("cuentas_por_cobrar").insert({
        user_id: uid,
        cliente_nombre: formCxC.cliente_nombre,
        concepto: formCxC.concepto,
        monto: Number(formCxC.monto),
        fecha_vencimiento: formCxC.fecha_vencimiento || null,
        notas: formCxC.notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas-cobrar"] });
      setDialogCxC(false);
      setFormCxC({ cliente_nombre: "", concepto: "", monto: "", fecha_vencimiento: "", notas: "" });
      toast.success("Cuenta por cobrar registrada");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const saveRecordatorio = useMutation({
    mutationFn: async () => {
      const uid = await getUserId(); if (!uid) throw new Error("No auth");
      const { error } = await supabase.from("recordatorios_pago").insert({
        user_id: uid,
        titulo: formRec.titulo,
        tipo: formRec.tipo,
        descripcion: formRec.descripcion || null,
        monto: formRec.monto ? Number(formRec.monto) : null,
        fecha_recordatorio: formRec.fecha_recordatorio,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordatorios"] });
      setDialogRecordatorio(false);
      setFormRec({ titulo: "", tipo: "general", descripcion: "", monto: "", fecha_recordatorio: "" });
      toast.success("Recordatorio creado");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const updateEstadoCxP = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("cuentas_por_pagar").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cuentas-pagar"] }),
  });

  const updateEstadoCxC = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("cuentas_por_cobrar").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cuentas-cobrar"] }),
  });

  const updateEstadoRec = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("recordatorios_pago").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recordatorios"] }),
  });

  const deleteCxP = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cuentas_por_pagar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cuentas-pagar"] }),
  });

  const deleteCxC = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cuentas_por_cobrar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cuentas-cobrar"] }),
  });

  // ── Estado badge ────────────────────────────────────────────────────────────

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      pagado:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      cobrado:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      vencido:   "bg-rose-500/15 text-rose-400 border-rose-500/30",
      completado:"bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
    return map[estado] ?? "bg-muted text-muted-foreground";
  };

  const diasParaVencer = (fecha: string | null) => {
    if (!fecha) return null;
    const diff = differenceInDays(parseISO(fecha), startOfDay(new Date()));
    return diff;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanzas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Flujo de caja · Cuentas por cobrar y pagar · Recordatorios</p>
        </div>
        <div className="flex items-center gap-2">
          {recordsPend > 0 && (
            <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1">
              <Bell className="h-3 w-3" /> {recordsPend} recordatorio{recordsPend > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Ingresos ({periodo})</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{COP(totalIngresos)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-rose-400" />
              <span className="text-xs text-muted-foreground">Egresos ({periodo})</span>
            </div>
            <p className="text-xl font-bold text-rose-400">{COP(totalEgresos)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Neto ({periodo})</span>
            </div>
            <p className={`text-xl font-bold ${neto >= 0 ? "text-blue-400" : "text-orange-400"}`}>{COP(neto)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Por pagar</span>
            </div>
            <p className="text-xl font-bold text-amber-400">{COP(totalCxP)}</p>
            {cxpVencidas > 0 && <p className="text-xs text-rose-400 mt-0.5">{cxpVencidas} vencida{cxpVencidas > 1 ? "s" : ""}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="flujo">Flujo de Caja</TabsTrigger>
          <TabsTrigger value="pagar">
            Cuentas × Pagar
            {cxpVencidas > 0 && <span className="ml-1.5 text-rose-400">●</span>}
          </TabsTrigger>
          <TabsTrigger value="cobrar">
            Cuentas × Cobrar
            {cxcVencidas > 0 && <span className="ml-1.5 text-rose-400">●</span>}
          </TabsTrigger>
          <TabsTrigger value="recordatorios">
            Recordatorios
            {recordsPend > 0 && <span className="ml-1.5 text-amber-400">●</span>}
          </TabsTrigger>
        </TabsList>

        {/* ────────────────── FLUJO DE CAJA ───────────────────────── */}
        <TabsContent value="flujo" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Línea de tiempo financiera</CardTitle>
                <div className="flex gap-1">
                  {(["7d", "30d", "90d"] as const).map(p => (
                    <Button
                      key={p}
                      size="sm"
                      variant={periodo === p ? "default" : "ghost"}
                      className="h-7 px-2 text-xs"
                      onClick={() => setPeriodo(p)}
                    >
                      {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    interval={periodo === "7d" ? 0 : periodo === "30d" ? 4 : 8}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => v === "ingresos" ? "Ingresos" : "Egresos"} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <Area type="monotone" dataKey="ingresos" stroke="#34d399" fill="url(#gradIngresos)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="egresos"  stroke="#f87171" fill="url(#gradEgresos)"  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Timeline summary */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total ingresos</p>
                  <p className="text-lg font-bold text-emerald-400">{COP(totalIngresos)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total egresos</p>
                  <p className="text-lg font-bold text-rose-400">{COP(totalEgresos)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Flujo neto</p>
                  <p className={`text-lg font-bold ${neto >= 0 ? "text-blue-400" : "text-orange-400"}`}>{COP(neto)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos vencimientos widget */}
          {cxpList.filter(c => c.fecha_vencimiento && c.estado === "pendiente").length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Próximos vencimientos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cxpList
                  .filter(c => c.fecha_vencimiento && c.estado === "pendiente")
                  .sort((a, b) => (a.fecha_vencimiento! > b.fecha_vencimiento! ? 1 : -1))
                  .slice(0, 5)
                  .map(c => {
                    const dias = diasParaVencer(c.fecha_vencimiento);
                    return (
                      <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{c.nombre}</p>
                          <p className="text-xs text-muted-foreground">{c.categoria}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{COP(c.monto)}</p>
                          {dias !== null && (
                            <p className={`text-xs ${dias <= 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-muted-foreground"}`}>
                              {dias <= 0 ? "Vencido" : `${dias}d restantes`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────────────────── CUENTAS POR PAGAR ─────────────────────── */}
        <TabsContent value="pagar" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {cxpList.filter(c => c.estado === "pendiente").length} pendientes · {COP(totalCxP)} total
              </p>
            </div>
            <Dialog open={dialogCxP} onOpenChange={setDialogCxP}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nueva cuenta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Cuenta por Pagar</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre *</Label>
                      <Input placeholder="Ej: Arriendo" value={formCxP.nombre} onChange={e => setFormCxP(p => ({ ...p, nombre: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Monto *</Label>
                      <Input type="number" placeholder="0" value={formCxP.monto} onChange={e => setFormCxP(p => ({ ...p, monto: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Categoría</Label>
                      <Select value={formCxP.categoria} onValueChange={v => setFormCxP(p => ({ ...p, categoria: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIAS_CXP.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Periodicidad</Label>
                      <Select value={formCxP.periodicidad} onValueChange={v => setFormCxP(p => ({ ...p, periodicidad: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PERIODICIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Día de vencimiento</Label>
                      <Input type="number" min={1} max={31} placeholder="Ej: 5" value={formCxP.dia_vencimiento} onChange={e => setFormCxP(p => ({ ...p, dia_vencimiento: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fecha específica</Label>
                      <Input type="date" value={formCxP.fecha_vencimiento} onChange={e => setFormCxP(p => ({ ...p, fecha_vencimiento: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Proveedor / Beneficiario</Label>
                    <Input placeholder="Ej: Acueducto Bogotá" value={formCxP.proveedor} onChange={e => setFormCxP(p => ({ ...p, proveedor: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notas</Label>
                    <Textarea rows={2} placeholder="Referencia, cuenta bancaria..." value={formCxP.notas} onChange={e => setFormCxP(p => ({ ...p, notas: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={() => saveCxP.mutate()} disabled={!formCxP.nombre || !formCxP.monto || saveCxP.isPending}>
                    {saveCxP.isPending ? "Guardando..." : "Guardar cuenta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {loadingCxP && <p className="text-sm text-muted-foreground">Cargando...</p>}
            {cxpList.length === 0 && !loadingCxP && (
              <Card className="bg-card border-border">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No hay cuentas por pagar registradas. Agrega arriendo, servicios, etc.
                </CardContent>
              </Card>
            )}
            {cxpList.map(c => {
              const dias = diasParaVencer(c.fecha_vencimiento);
              return (
                <Card key={c.id} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{c.nombre}</p>
                        <Badge variant="outline" className="text-xs">{c.categoria}</Badge>
                        <Badge variant="outline" className="text-xs">{PERIODICIDADES.find(p => p.value === c.periodicidad)?.label}</Badge>
                        <Badge variant="outline" className={`text-xs ${estadoBadge(c.estado)}`}>{c.estado}</Badge>
                      </div>
                      {c.proveedor && <p className="text-xs text-muted-foreground mt-0.5">{c.proveedor}</p>}
                      {dias !== null && (
                        <p className={`text-xs mt-0.5 ${dias <= 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-muted-foreground"}`}>
                          {dias <= 0 ? "⚠ Vencido" : `Vence en ${dias} días`}
                        </p>
                      )}
                      {c.dia_vencimiento && !c.fecha_vencimiento && (
                        <p className="text-xs text-muted-foreground mt-0.5">Vence día {c.dia_vencimiento} de cada mes</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-amber-400">{COP(c.monto)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.estado !== "pagado" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300" onClick={() => updateEstadoCxP.mutate({ id: c.id, estado: "pagado" })}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-400" onClick={() => deleteCxP.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ────────────────── CUENTAS POR COBRAR ─────────────────────── */}
        <TabsContent value="cobrar" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {cxcList.filter(c => c.estado === "pendiente").length} pendientes · {COP(totalCxC)} total
              </p>
            </div>
            <Dialog open={dialogCxC} onOpenChange={setDialogCxC}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nueva cuenta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Cuenta por Cobrar</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cliente *</Label>
                      <Input placeholder="Nombre del cliente" value={formCxC.cliente_nombre} onChange={e => setFormCxC(p => ({ ...p, cliente_nombre: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Monto *</Label>
                      <Input type="number" placeholder="0" value={formCxC.monto} onChange={e => setFormCxC(p => ({ ...p, monto: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Concepto *</Label>
                    <Input placeholder="Ej: Anticipo evento privado" value={formCxC.concepto} onChange={e => setFormCxC(p => ({ ...p, concepto: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de vencimiento</Label>
                    <Input type="date" value={formCxC.fecha_vencimiento} onChange={e => setFormCxC(p => ({ ...p, fecha_vencimiento: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notas</Label>
                    <Textarea rows={2} placeholder="Detalles adicionales..." value={formCxC.notas} onChange={e => setFormCxC(p => ({ ...p, notas: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={() => saveCxC.mutate()} disabled={!formCxC.cliente_nombre || !formCxC.monto || !formCxC.concepto || saveCxC.isPending}>
                    {saveCxC.isPending ? "Guardando..." : "Guardar cuenta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {loadingCxC && <p className="text-sm text-muted-foreground">Cargando...</p>}
            {cxcList.length === 0 && !loadingCxC && (
              <Card className="bg-card border-border">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  No hay cuentas por cobrar. Registra anticipos, créditos o deudas de clientes.
                </CardContent>
              </Card>
            )}
            {cxcList.map(c => {
              const dias = diasParaVencer(c.fecha_vencimiento);
              return (
                <Card key={c.id} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{c.cliente_nombre}</p>
                        <Badge variant="outline" className={`text-xs ${estadoBadge(c.estado)}`}>{c.estado}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.concepto}</p>
                      {dias !== null && (
                        <p className={`text-xs mt-0.5 ${dias <= 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-muted-foreground"}`}>
                          {dias <= 0 ? "⚠ Vencido" : `Vence en ${dias} días`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-400">{COP(c.monto)}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(c.fecha_emision), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.estado !== "cobrado" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300" onClick={() => updateEstadoCxC.mutate({ id: c.id, estado: "cobrado" })}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-400" onClick={() => deleteCxC.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ────────────────── RECORDATORIOS ─────────────────────────── */}
        <TabsContent value="recordatorios" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {recordatorios.filter(r => r.estado === "pendiente").length} pendientes
            </p>
            <Dialog open={dialogRecordatorio} onOpenChange={setDialogRecordatorio}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nuevo recordatorio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo Recordatorio</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Título *</Label>
                    <Input placeholder="Ej: Pagar arriendo" value={formRec.titulo} onChange={e => setFormRec(p => ({ ...p, titulo: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={formRec.tipo} onValueChange={v => setFormRec(p => ({ ...p, tipo: v }))}>
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
                      <Input type="number" placeholder="0" value={formRec.monto} onChange={e => setFormRec(p => ({ ...p, monto: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha recordatorio *</Label>
                    <Input type="date" value={formRec.fecha_recordatorio} onChange={e => setFormRec(p => ({ ...p, fecha_recordatorio: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descripción</Label>
                    <Textarea rows={2} value={formRec.descripcion} onChange={e => setFormRec(p => ({ ...p, descripcion: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={() => saveRecordatorio.mutate()} disabled={!formRec.titulo || !formRec.fecha_recordatorio || saveRecordatorio.isPending}>
                    {saveRecordatorio.isPending ? "Guardando..." : "Crear recordatorio"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {recordatorios.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                  Sin recordatorios. Crea alertas para pagos, cobros o cualquier evento financiero.
                </CardContent>
              </Card>
            )}
            {recordatorios.map(r => {
              const dias = diasParaVencer(r.fecha_recordatorio);
              const tipoColor = r.tipo === "pagar" ? "text-amber-400" : r.tipo === "cobrar" ? "text-emerald-400" : "text-blue-400";
              const tipoIcon = r.tipo === "pagar" ? <ArrowDownCircle className="h-4 w-4" /> : r.tipo === "cobrar" ? <ArrowUpCircle className="h-4 w-4" /> : <Bell className="h-4 w-4" />;
              return (
                <Card key={r.id} className={`bg-card border-border ${r.estado === "completado" ? "opacity-50" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`shrink-0 ${tipoColor}`}>{tipoIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{r.titulo}</p>
                        <Badge variant="outline" className={`text-xs ${estadoBadge(r.estado)}`}>{r.estado}</Badge>
                      </div>
                      {r.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{r.descripcion}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className={`text-xs ${dias !== null && dias <= 0 ? "text-rose-400" : dias !== null && dias <= 3 ? "text-amber-400" : "text-muted-foreground"}`}>
                          {format(parseISO(r.fecha_recordatorio), "dd/MM/yyyy")}
                          {dias !== null && (dias <= 0 ? " · Vencido" : ` · ${dias}d`)}
                        </p>
                      </div>
                    </div>
                    {r.monto && <p className="font-semibold text-sm shrink-0">{COP(r.monto)}</p>}
                    <div className="flex items-center gap-1 shrink-0">
                      {r.estado !== "completado" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400" onClick={() => updateEstadoRec.mutate({ id: r.id, estado: "completado" })}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
