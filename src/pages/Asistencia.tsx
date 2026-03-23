import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock, LogIn, LogOut, Users, Calendar, RefreshCw, AlertCircle
} from "lucide-react";
import { format, differenceInMinutes, differenceInHours, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string | null;
  valor_hora: number;
}

interface Registro {
  id: string;
  empleado_id: string;
  tipo: string;
  timestamp: string;
  notas: string | null;
}

interface EstadoEmpleado {
  empleado: Empleado;
  estado: "entrada" | "salida" | null;
  ultimoRegistro: Registro | null;
  horasHoy: number;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

function calcHorasHoy(registros: Registro[]): number {
  const sorted = [...registros].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let total = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].tipo === "entrada" && sorted[i + 1].tipo === "salida") {
      total += differenceInMinutes(new Date(sorted[i + 1].timestamp), new Date(sorted[i].timestamp));
      i++;
    }
  }
  return total / 60;
}

export default function Asistencia() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [estados, setEstados] = useState<EstadoEmpleado[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(format(new Date(), "yyyy-MM-dd"));
  const [registrando, setRegistrando] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [empRes, regRes] = await Promise.all([
      supabase.from("empleados").select("id, nombre, apellido, cargo, valor_hora").eq("user_id", user.id).eq("estado", "activo").order("apellido"),
      supabase.from("registros_asistencia")
        .select("*")
        .eq("user_id", user.id)
        .gte("timestamp", startOfDay(new Date(fechaFiltro)).toISOString())
        .lte("timestamp", endOfDay(new Date(fechaFiltro)).toISOString())
        .order("timestamp", { ascending: false })
    ]);

    const emps: Empleado[] = empRes.data || [];
    const regs: Registro[] = regRes.data || [];
    setEmpleados(emps);
    setRegistros(regs);

    const estadosMap: EstadoEmpleado[] = emps.map(emp => {
      const empRegs = regs.filter(r => r.empleado_id === emp.id).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const ultimo = empRegs[0] || null;
      return {
        empleado: emp,
        estado: ultimo ? (ultimo.tipo as "entrada" | "salida") : null,
        ultimoRegistro: ultimo,
        horasHoy: calcHorasHoy(regs.filter(r => r.empleado_id === emp.id)),
      };
    });

    setEstados(estadosMap);
    setLoading(false);
  }, [fechaFiltro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClock = async (empleadoId: string, tipo: "entrada" | "salida") => {
    setRegistrando(empleadoId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("registros_asistencia").insert({
        user_id: user.id,
        empleado_id: empleadoId,
        tipo,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      const emp = empleados.find(e => e.id === empleadoId);
      toast.success(`${emp?.nombre} — ${tipo === "entrada" ? "✅ Entrada" : "🔴 Salida"} registrada`);
      fetchData();
    } catch { toast.error("Error al registrar"); }
    finally { setRegistrando(null); }
  };

  const isHoy = fechaFiltro === format(new Date(), "yyyy-MM-dd");
  const totalHoras = estados.reduce((s, e) => s + e.horasHoy, 0);
  const activos = estados.filter(e => e.estado === "entrada").length;

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando asistencia...</div>;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Asistencia
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Clock-in / Clock-out del personal</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} className="w-40" />
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{activos}</p>
            <p className="text-xs text-muted-foreground">En turno ahora</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{totalHoras.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Horas totales del día</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{empleados.length}</p>
            <p className="text-xs text-muted-foreground">Empleados activos</p>
          </CardContent>
        </Card>
      </div>

      {empleados.length === 0 ? (
        <div className="border rounded-lg border-dashed p-12 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay empleados activos. Registra empleados primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estados.map(({ empleado, estado, ultimoRegistro, horasHoy }) => (
            <Card key={empleado.id} className={`transition-all ${estado === "entrada" ? "border-green-400 dark:border-green-700" : ""}`}>
              <CardContent className="pt-4 space-y-3">
                {/* Nombre + estado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {empleado.nombre[0]}{empleado.apellido[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{empleado.nombre} {empleado.apellido}</p>
                      <p className="text-xs text-muted-foreground">{empleado.cargo || "—"}</p>
                    </div>
                  </div>
                  <Badge variant={estado === "entrada" ? "default" : "secondary"} className={`text-xs ${estado === "entrada" ? "bg-green-600" : ""}`}>
                    {estado === "entrada" ? "En turno" : estado === "salida" ? "Salida" : "Sin registro"}
                  </Badge>
                </div>

                {/* Info */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {ultimoRegistro
                      ? `Último: ${ultimoRegistro.tipo} ${format(new Date(ultimoRegistro.timestamp), "HH:mm")}`
                      : "Sin registros hoy"}
                  </span>
                  <span className="font-semibold text-foreground">{horasHoy.toFixed(1)}h hoy</span>
                </div>

                {empleado.valor_hora > 0 && horasHoy > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Costo estimado: <span className="font-semibold text-foreground">{formatCOP(horasHoy * empleado.valor_hora)}</span>
                  </p>
                )}

                {/* Botones clock */}
                {isHoy && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={estado === "entrada" || registrando === empleado.id}
                      onClick={() => handleClock(empleado.id, "entrada")}
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      Entrada
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      disabled={estado !== "entrada" || registrando === empleado.id}
                      onClick={() => handleClock(empleado.id, "salida")}
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Salida
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabla de registros del día */}
      {registros.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3">
            Registros del {format(new Date(fechaFiltro + "T12:00:00"), "dd/MM/yyyy", { locale: es })}
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Empleado</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {registros.map(r => {
                  const emp = empleados.find(e => e.id === r.empleado_id);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2">{emp ? `${emp.nombre} ${emp.apellido}` : "—"}</td>
                      <td className="px-4 py-2">
                        <Badge variant={r.tipo === "entrada" ? "default" : "secondary"} className={`text-xs ${r.tipo === "entrada" ? "bg-green-600" : "bg-red-600 text-white"}`}>
                          {r.tipo === "entrada" ? "↑ Entrada" : "↓ Salida"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono">{format(new Date(r.timestamp), "HH:mm:ss")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
