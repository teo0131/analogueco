import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  TrendingUp, ArrowUpCircle, ArrowDownCircle,
  AlertCircle, CreditCard, Bell, ArrowRight,
} from "lucide-react";
import { format, subDays, parseISO, differenceInDays, startOfDay } from "date-fns";

const COP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

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

export default function Finanzas() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d">("30d");
  const diasPeriodo = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const { data: ventasPeriodo = [] } = useQuery({
    queryKey: ["finanzas-ventas", periodo],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const desde = format(subDays(new Date(), diasPeriodo), "yyyy-MM-dd");
      const { data } = await supabase.from("ordenes_pos").select("total, fecha").eq("user_id", uid).gte("fecha", desde);
      return data ?? [];
    },
  });

  const { data: gastosPeriodo = [] } = useQuery({
    queryKey: ["finanzas-gastos", periodo],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const desde = format(subDays(new Date(), diasPeriodo), "yyyy-MM-dd");
      const { data } = await supabase.from("gastos_operativos").select("monto, fecha").eq("user_id", uid).gte("fecha", desde);
      return data ?? [];
    },
  });

  const { data: cxpPendientes = [] } = useQuery({
    queryKey: ["finanzas-cxp-kpi"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase.from("cuentas_por_pagar").select("monto, estado, fecha_vencimiento, nombre").eq("user_id", uid);
      return data ?? [];
    },
  });

  const { data: cxcPendientes = [] } = useQuery({
    queryKey: ["finanzas-cxc-kpi"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase.from("cuentas_por_cobrar").select("monto, estado, fecha_vencimiento, cliente_nombre, concepto").eq("user_id", uid);
      return data ?? [];
    },
  });

  const { data: recordatorios = [] } = useQuery({
    queryKey: ["finanzas-rec-kpi"],
    queryFn: async () => {
      const uid = await getUserId(); if (!uid) return [];
      const { data } = await supabase.from("recordatorios_pago").select("estado, fecha_recordatorio, titulo").eq("user_id", uid).eq("estado", "pendiente").order("fecha_recordatorio");
      return data ?? [];
    },
  });

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

  const totalCxP    = cxpPendientes.filter((c: any) => c.estado === "pendiente").reduce((s: number, c: any) => s + c.monto, 0);
  const totalCxC    = cxcPendientes.filter((c: any) => c.estado === "pendiente").reduce((s: number, c: any) => s + c.monto, 0);
  const cxpVencidas = cxpPendientes.filter((c: any) => c.estado === "vencido").length;
  const cxcVencidas = cxcPendientes.filter((c: any) => c.estado === "vencido").length;

  const proxVencimientos = [
    ...cxpPendientes
      .filter((c: any) => c.fecha_vencimiento && c.estado === "pendiente")
      .map((c: any) => ({ nombre: c.nombre, monto: c.monto, fecha: c.fecha_vencimiento, tipo: "pagar" })),
    ...cxcPendientes
      .filter((c: any) => c.fecha_vencimiento && c.estado === "pendiente")
      .map((c: any) => ({ nombre: `${c.cliente_nombre} — ${c.concepto}`, monto: c.monto, fecha: c.fecha_vencimiento, tipo: "cobrar" })),
  ]
    .sort((a, b) => a.fecha > b.fecha ? 1 : -1)
    .slice(0, 6);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Flujo de Caja</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ingresos y egresos en el tiempo</p>
      </div>

      {/* KPIs */}
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

      {/* Gráfica */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Línea de tiempo financiera</CardTitle>
            <div className="flex gap-1">
              {(["7d", "30d", "90d"] as const).map(p => (
                <Button key={p} size="sm" variant={periodo === p ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setPeriodo(p)}>
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
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} interval={periodo === "7d" ? 0 : periodo === "30d" ? 4 : 8} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => v === "ingresos" ? "Ingresos" : "Egresos"} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
              <Area type="monotone" dataKey="ingresos" stroke="#34d399" fill="url(#gradIngresos)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="egresos"  stroke="#f87171" fill="url(#gradEgresos)"  strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
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

      {/* Shortcuts CxP / CxC / Recordatorios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* CxP */}
        <Card className="bg-card border-border hover:border-amber-500/40 transition-colors cursor-pointer" onClick={() => navigate("/finanzas/cuentas-pagar")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-sm">Cuentas × Pagar</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{COP(totalCxP)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cxpPendientes.filter((c: any) => c.estado === "pendiente").length} pendientes
              {cxpVencidas > 0 && <span className="text-rose-400 ml-1">· {cxpVencidas} vencidas</span>}
            </p>
          </CardContent>
        </Card>

        {/* CxC */}
        <Card className="bg-card border-border hover:border-emerald-500/40 transition-colors cursor-pointer" onClick={() => navigate("/finanzas/cuentas-cobrar")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-sm">Cuentas × Cobrar</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{COP(totalCxC)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cxcPendientes.filter((c: any) => c.estado === "pendiente").length} pendientes
              {cxcVencidas > 0 && <span className="text-rose-400 ml-1">· {cxcVencidas} vencidas</span>}
            </p>
          </CardContent>
        </Card>

        {/* Recordatorios */}
        <Card className="bg-card border-border hover:border-blue-500/40 transition-colors cursor-pointer" onClick={() => navigate("/finanzas/recordatorios")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-sm">Recordatorios</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{recordatorios.length}</p>
            <p className="text-xs text-muted-foreground mt-1">pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximos vencimientos */}
      {proxVencimientos.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-4 w-4" /> Próximos vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {proxVencimientos.map((v, i) => {
              const dias = differenceInDays(parseISO(v.fecha), startOfDay(new Date()));
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    {v.tipo === "pagar"
                      ? <ArrowDownCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      : <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    <p className="text-sm">{v.nombre}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold">{COP(v.monto)}</p>
                    <p className={`text-xs w-20 text-right ${dias <= 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {dias <= 0 ? "Vencido" : `${dias}d restantes`}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
