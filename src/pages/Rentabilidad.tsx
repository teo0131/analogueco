import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  TrendingUp, TrendingDown, Plus, Trash2, Wallet, Target,
  ArrowUpCircle, ArrowDownCircle, Percent, AlertTriangle,
} from "lucide-react";

const COP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v));

const CATEGORIAS = ["local", "personal", "tecnologia", "financiero", "impuestos", "marketing", "general"];

type GastoFijo = {
  id: string; concepto: string; monto: number; categoria: string; activo: boolean; notas: string | null;
};

type Fila = {
  producto: string; unidades: number; venta: number; costo_unitario: number; costo_total: number;
};

export default function Rentabilidad() {
  const qc = useQueryClient();
  const [meses, setMeses] = useState(3);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ concepto: "", monto: "", categoria: "general" });
  const [pinOpen, setPinOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [pinDesc, setPinDesc] = useState("");

  const hoy = new Date();
  const desde = format(startOfMonth(subMonths(hoy, meses)), "yyyy-MM-dd");
  const hasta = format(endOfMonth(subMonths(hoy, 1)), "yyyy-MM-dd");

  const { data: filas = [], isLoading } = useQuery({
    queryKey: ["rentabilidad", meses],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rentabilidad_por_producto", { desde, hasta });
      if (error) throw error;
      return (data ?? []) as Fila[];
    },
  });

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos-fijos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gastos_fijos").select("*").order("monto", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GastoFijo[];
    },
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gastos_fijos").insert({
        concepto: form.concepto, monto: Number(form.monto), categoria: form.categoria,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gasto fijo agregado");
      setDialogOpen(false);
      setForm({ concepto: "", monto: "", categoria: "general" });
      qc.invalidateQueries({ queryKey: ["gastos-fijos"] });
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo guardar"),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gastos_fijos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gasto eliminado");
      qc.invalidateQueries({ queryKey: ["gastos-fijos"] });
    },
  });

  const pedirPin = (desc: string, fn: () => void) => {
    setPinDesc(desc);
    setPending(() => fn);
    setPinOpen(true);
  };

  const kpi = useMemo(() => {
    const venta = filas.reduce((s, f) => s + Number(f.venta), 0);
    const costo = filas.reduce((s, f) => s + Number(f.costo_total), 0);
    const ventaMes = venta / meses;
    const costoMes = costo / meses;
    const bruta = ventaMes - costoMes;
    const fijos = gastos.filter(g => g.activo).reduce((s, g) => s + Number(g.monto), 0);
    const neta = bruta - fijos;
    const margenBruto = ventaMes ? bruta / ventaMes : 0;
    const equilibrio = margenBruto > 0 ? fijos / margenBruto : 0;
    return { venta, costo, ventaMes, costoMes, bruta, fijos, neta, margenBruto, equilibrio };
  }, [filas, gastos, meses]);

  const sinCosto = filas.filter(f => Number(f.costo_unitario) <= 0);

  const ranking = useMemo(() =>
    [...filas]
      .map(f => ({ ...f, margen: Number(f.venta) - Number(f.costo_total) }))
      .sort((a, b) => b.margen - a.margen),
    [filas]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rentabilidad</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ventas reales − costo de producto − gastos fijos · {desde} → {hasta}
          </p>
        </div>
        <div className="flex gap-1">
          {[1, 3, 6].map(m => (
            <Button key={m} size="sm" variant={meses === m ? "default" : "ghost"} className="h-8 px-3 text-xs"
              onClick={() => setMeses(m)}>
              {m} {m === 1 ? "mes" : "meses"}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Ventas / mes</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{COP(kpi.ventaMes)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-rose-400" />
              <span className="text-xs text-muted-foreground">Costo producto / mes</span>
            </div>
            <p className="text-xl font-bold text-rose-400">{COP(kpi.costoMes)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Utilidad bruta / mes</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{COP(kpi.bruta)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(kpi.margenBruto * 100).toFixed(1)}% margen</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Gastos fijos / mes</span>
            </div>
            <p className="text-xl font-bold text-amber-400">{COP(kpi.fijos)}</p>
          </CardContent>
        </Card>
        <Card className={`border ${kpi.neta >= 0 ? "border-emerald-500/40" : "border-rose-500/40"} bg-card`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {kpi.neta >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
              <span className="text-xs text-muted-foreground">Utilidad neta / mes</span>
            </div>
            <p className={`text-xl font-bold ${kpi.neta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{COP(kpi.neta)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kpi.ventaMes ? ((kpi.neta / kpi.ventaMes) * 100).toFixed(1) : "0"}% sobre ventas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Punto de equilibrio */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Punto de equilibrio mensual</p>
              <p className="text-lg font-bold">{COP(kpi.equilibrio)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Punto de equilibrio diario (30 días)</p>
            <p className="text-lg font-bold">{COP(kpi.equilibrio / 30)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Proyección anual (×12)</p>
            <p className={`text-lg font-bold ${kpi.neta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{COP(kpi.neta * 12)}</p>
          </div>
        </CardContent>
      </Card>

      {sinCosto.length > 0 && (
        <Card className="bg-card border-amber-500/40">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">{sinCosto.length} producto(s) sin costo cargado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sinCosto.slice(0, 8).map(f => f.producto).join(", ")}
                {sinCosto.length > 8 ? "…" : ""} — cárgalos en Menú → costo unitario para que la utilidad sea exacta.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gastos fijos */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Gastos fijos mensuales</CardTitle>
            <Button size="sm" className="h-8" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {gastos.length === 0 && <p className="text-sm text-muted-foreground py-4">Aún no hay gastos fijos cargados.</p>}
            {gastos.map(g => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate">{g.concepto}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{g.categoria}</Badge>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold">{COP(Number(g.monto))}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {kpi.fijos ? ((Number(g.monto) / kpi.fijos) * 100).toFixed(0) : 0}%
                  </span>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => pedirPin(`Eliminar el gasto fijo "${g.concepto}"`, () => eliminar.mutate(g.id))}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
              <span className="text-sm font-bold">Total</span>
              <span className="text-base font-bold text-amber-400">{COP(kpi.fijos)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Margen por producto ({meses} {meses === 1 ? "mes" : "meses"})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground py-4">Calculando…</p>}
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-1.5">Producto</th>
                  <th className="text-right font-medium">Uds</th>
                  <th className="text-right font-medium">Venta</th>
                  <th className="text-right font-medium">Margen</th>
                  <th className="text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(f => {
                  const pct = Number(f.venta) ? (f.margen / Number(f.venta)) * 100 : 0;
                  return (
                    <tr key={f.producto} className="border-b border-border/30 last:border-0">
                      <td className="py-1.5 pr-2">{f.producto}</td>
                      <td className="text-right tabular-nums">{f.unidades}</td>
                      <td className="text-right tabular-nums">{COP(Number(f.venta))}</td>
                      <td className={`text-right tabular-nums ${f.margen >= 0 ? "" : "text-rose-400"}`}>{COP(f.margen)}</td>
                      <td className={`text-right tabular-nums ${pct >= 50 ? "text-emerald-400" : pct >= 30 ? "text-amber-400" : "text-rose-400"}`}>
                        {pct.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog nuevo gasto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo gasto fijo mensual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Concepto</Label>
              <Input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Arriendo, nómina…" />
            </div>
            <div>
              <Label>Monto mensual</Label>
              <Input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!form.concepto || !form.monto || guardar.isPending}
              onClick={() => pedirPin(`Agregar el gasto fijo "${form.concepto}"`, () => guardar.mutate())}>
              {guardar.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PinVerificationDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        description={pinDesc}
        onSuccess={() => { pending?.(); setPending(null); setPinOpen(false); }}
      />
    </div>
  );
}
