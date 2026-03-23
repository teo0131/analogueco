import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign, Plus, Calculator, Check, Trash2, Calendar, Users,
  TrendingUp, RefreshCw, Clock
} from "lucide-react";
import { format, differenceInDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string | null;
  salario_base: number;
  valor_hora: number;
  tipo_pago: string;
}

interface Nomina {
  id: string;
  empleado_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  horas_trabajadas: number;
  salario_base: number;
  valor_hora: number;
  total_devengado: number;
  deducciones: number;
  total_pagar: number;
  estado: string;
  notas: string | null;
  created_at: string;
  empleado?: Empleado;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

export default function Nomina() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [empId, setEmpId] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState(format(new Date(), "yyyy-MM-01"));
  const [periodoFin, setPeriodoFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [horasExtra, setHorasExtra] = useState("0");
  const [deducciones, setDeducciones] = useState("0");
  const [notas, setNotas] = useState("");
  const [autoCalc, setAutoCalc] = useState(true);

  // Calculated preview
  const [preview, setPreview] = useState<{
    horasTrabajadas: number; salarioBase: number; valorHora: number;
    totalDevengado: number; totalPagar: number;
  } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [empRes, nomRes] = await Promise.all([
      supabase.from("empleados").select("id, nombre, apellido, cargo, salario_base, valor_hora, tipo_pago")
        .eq("user_id", user.id).eq("estado", "activo").order("apellido"),
      supabase.from("nominas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
    ]);
    const emps: Empleado[] = empRes.data || [];
    const noms: Nomina[] = (nomRes.data || []).map((n: any) => ({
      ...n,
      empleado: emps.find(e => e.id === n.empleado_id)
    }));
    setEmpleados(emps);
    setNominas(noms);
    setLoading(false);
  };

  // Calcular preview automáticamente
  const calcPreview = useCallback(async () => {
    if (!empId || !periodoInicio || !periodoFin) { setPreview(null); return; }
    const emp = empleados.find(e => e.id === empId);
    if (!emp) { setPreview(null); return; }

    // Obtener horas del período
    const { data: regs } = await supabase
      .from("registros_asistencia")
      .select("tipo, timestamp")
      .eq("empleado_id", empId)
      .gte("timestamp", startOfDay(new Date(periodoInicio)).toISOString())
      .lte("timestamp", endOfDay(new Date(periodoFin)).toISOString())
      .order("timestamp");

    let horasDB = 0;
    if (regs) {
      for (let i = 0; i < regs.length - 1; i++) {
        if (regs[i].tipo === "entrada" && regs[i + 1].tipo === "salida") {
          const mins = (new Date(regs[i + 1].timestamp).getTime() - new Date(regs[i].timestamp).getTime()) / 60000;
          horasDB += mins / 60;
          i++;
        }
      }
    }

    const horasTotales = horasDB + parseFloat(horasExtra || "0");
    const salario = emp.salario_base;
    const extra = parseFloat(horasExtra || "0") * emp.valor_hora;
    const totalDev = salario + extra;
    const ded = parseFloat(deducciones || "0");
    const totalPagar = Math.max(0, totalDev - ded);

    setPreview({
      horasTrabajadas: horasTotales,
      salarioBase: salario,
      valorHora: emp.valor_hora,
      totalDevengado: totalDev,
      totalPagar,
    });
  }, [empId, periodoInicio, periodoFin, horasExtra, deducciones, empleados]);

  useEffect(() => { if (autoCalc) calcPreview(); }, [autoCalc, calcPreview]);

  const handleGenerarNomina = async () => {
    if (!empId || !preview) { toast.error("Selecciona empleado y período"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const emp = empleados.find(e => e.id === empId);
      const { error } = await supabase.from("nominas").insert({
        user_id: user.id,
        empleado_id: empId,
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        horas_trabajadas: preview.horasTrabajadas,
        salario_base: preview.salarioBase,
        valor_hora: preview.valorHora,
        total_devengado: preview.totalDevengado,
        deducciones: parseFloat(deducciones || "0"),
        total_pagar: preview.totalPagar,
        estado: "pendiente",
        notas: notas || null,
      });
      if (error) throw error;
      toast.success(`Nómina generada para ${emp?.nombre} ${emp?.apellido}`);
      setShowForm(false);
      fetchAll();
    } catch { toast.error("Error al generar nómina"); }
    finally { setSaving(false); }
  };

  const handleMarcarPagado = async (nominaId: string) => {
    const { error } = await supabase.from("nominas").update({ estado: "pagado" }).eq("id", nominaId);
    if (error) { toast.error("Error al actualizar"); return; }
    toast.success("Nómina marcada como pagada");
    fetchAll();
  };

  const handleEliminar = async (nominaId: string) => {
    if (!confirm("¿Eliminar esta nómina?")) return;
    await supabase.from("nominas").delete().eq("id", nominaId);
    toast.success("Nómina eliminada");
    fetchAll();
  };

  const totalPendiente = nominas.filter(n => n.estado === "pendiente").reduce((s, n) => s + n.total_pagar, 0);
  const totalPagado = nominas.filter(n => n.estado === "pagado").reduce((s, n) => s + n.total_pagar, 0);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando nóminas...</div>;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Nómina
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cálculo y gestión de pagos al personal</p>
        </div>
        <Button onClick={() => { setEmpId(""); setPreview(null); setHorasExtra("0"); setDeducciones("0"); setNotas(""); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />Generar Nómina
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCOP(totalPendiente)}</p>
              <p className="text-xs text-muted-foreground">Pendiente de pago</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCOP(totalPagado)}</p>
              <p className="text-xs text-muted-foreground">Pagado total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{nominas.length}</p>
              <p className="text-xs text-muted-foreground">Nóminas registradas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de nóminas */}
      {nominas.length === 0 ? (
        <div className="border rounded-lg border-dashed p-12 text-center text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin nóminas generadas. Haz clic en "Generar Nómina".</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Período</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Horas</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total a pagar</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {nominas.map(n => (
                <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {n.empleado?.nombre[0]}{n.empleado?.apellido[0]}
                      </div>
                      <div>
                        <p className="font-medium">{n.empleado?.nombre} {n.empleado?.apellido}</p>
                        <p className="text-xs text-muted-foreground">{n.empleado?.cargo || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(n.periodo_inicio + "T12:00:00"), "dd/MM")} — {format(new Date(n.periodo_fin + "T12:00:00"), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{n.horas_trabajadas.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{formatCOP(n.total_pagar)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={n.estado === "pagado" ? "default" : "secondary"}
                      className={n.estado === "pagado" ? "bg-green-600" : "bg-yellow-500 text-white"}>
                      {n.estado === "pagado" ? "Pagado" : "Pendiente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {n.estado === "pendiente" && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleMarcarPagado(n.id)}>
                          <Check className="w-3 h-3 mr-1" />Pagar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleEliminar(n.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog de generación */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Generar Nómina
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Empleado</Label>
              <Select value={empId} onValueChange={v => { setEmpId(v); setPreview(null); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                <SelectContent>
                  {empleados.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.apellido}, {e.nombre} — {formatCOP(e.salario_base)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Período inicio</Label>
                <Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Período fin</Label>
                <Input type="date" value={periodoFin} onChange={e => setPeriodoFin(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Horas adicionales</Label>
                <Input type="number" value={horasExtra} onChange={e => setHorasExtra(e.target.value)} min="0" step="0.5" />
              </div>
              <div className="space-y-1">
                <Label>Deducciones ($)</Label>
                <Input type="number" value={deducciones} onChange={e => setDeducciones(e.target.value)} min="0" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Bonificaciones, ausencias, etc." />
            </div>

            <Button variant="outline" className="w-full" onClick={calcPreview}>
              <Calculator className="w-4 h-4 mr-2" />Calcular
            </Button>

            {/* Preview */}
            {preview && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-3">Resumen</p>
                {[
                  ["Horas registradas", `${preview.horasTrabajadas.toFixed(1)}h`],
                  ["Salario base", formatCOP(preview.salarioBase)],
                  ["Extras/Bonos", formatCOP(preview.totalDevengado - preview.salarioBase)],
                  ["Total devengado", formatCOP(preview.totalDevengado)],
                  ["Deducciones", formatCOP(parseFloat(deducciones || "0"))],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total a pagar</span>
                  <span className="text-primary">{formatCOP(preview.totalPagar)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleGenerarNomina} disabled={saving || !preview}>
              {saving ? "Generando..." : "Generar Nómina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
