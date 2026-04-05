import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  CalendarDays, Plus, Pencil, Trash2, Download, DollarSign, Users,
  Package, FileText, Bell, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  hora?: string;
  tipo: string;
  es_recurrente: boolean;
  periodicidad?: string;
  dia_recurrente?: number;
  color: string;
  modulo_origen: string;
  referencia_id?: string;
  alerta_dias_antes: number;
  completado: boolean;
  notas?: string;
}

interface VirtualEvent {
  id: string;
  titulo: string;
  fecha: Date;
  tipo: string;
  color: string;
  modulo_origen: string;
  completado: boolean;
  descripcion?: string;
  hora?: string;
  es_virtual: boolean;
}

const TIPO_OPTIONS = [
  { value: "arriendo", label: "Arriendo", color: "#ef4444" },
  { value: "servicios", label: "Servicios Públicos", color: "#f97316" },
  { value: "impuesto", label: "Impuestos", color: "#dc2626" },
  { value: "permiso", label: "Permisos/Renovación", color: "#9333ea" },
  { value: "nomina", label: "Nómina", color: "#2563eb" },
  { value: "inventario", label: "Inventario", color: "#16a34a" },
  { value: "mantenimiento", label: "Mantenimiento", color: "#ca8a04" },
  { value: "reunion", label: "Reunión", color: "#0891b2" },
  { value: "otro", label: "Otro", color: "#6b7280" },
];

const MODULO_ICONS: Record<string, React.ElementType> = {
  cuentas_pagar: DollarSign,
  nomina: Users,
  inventario: Package,
  manual: FileText,
};

const getColorForTipo = (tipo: string) => TIPO_OPTIONS.find(t => t.value === tipo)?.color || "#6b7280";

// ── Component ──────────────────────────────────────────────────────────────────
const CalendarioNegocio = () => {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [filterModulo, setFilterModulo] = useState<string>("todos");
  const [form, setForm] = useState({
    titulo: "", descripcion: "", fecha_inicio: format(new Date(), "yyyy-MM-dd"),
    fecha_fin: "", hora: "", tipo: "otro", es_recurrente: false,
    periodicidad: "mensual", dia_recurrente: 1, color: "#6b7280",
    alerta_dias_antes: 1, notas: "",
  });

  // ── Fetch manual events ────────────────────────────────────────────────────
  const { data: manualEvents = [] } = useQuery({
    queryKey: ["calendario-eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendario_eventos")
        .select("*")
        .order("fecha_inicio");
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  // ── Fetch cuentas por pagar ────────────────────────────────────────────────
  const { data: cuentasPagar = [] } = useQuery({
    queryKey: ["calendario-cuentas-pagar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .select("*")
        .eq("estado", "pendiente");
      if (error) throw error;
      return data || [];
    },
  });

  // ── Fetch nómina data ──────────────────────────────────────────────────────
  const { data: empleados = [] } = useQuery({
    queryKey: ["calendario-empleados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select("id, nombre, apellido, tipo_pago, fecha_ingreso")
        .eq("estado", "activo");
      if (error) throw error;
      return data || [];
    },
  });

  // ── Build virtual events from modules ──────────────────────────────────────
  const allEvents = useMemo((): VirtualEvent[] => {
    const events: VirtualEvent[] = [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Manual events (including recurrent expansion)
    manualEvents.forEach(ev => {
      if (ev.es_recurrente && ev.dia_recurrente) {
        days.forEach(day => {
          if (day.getDate() === ev.dia_recurrente) {
            events.push({
              id: `${ev.id}-${format(day, "yyyy-MM-dd")}`,
              titulo: ev.titulo,
              fecha: day,
              tipo: ev.tipo,
              color: ev.color || getColorForTipo(ev.tipo),
              modulo_origen: ev.modulo_origen,
              completado: ev.completado,
              descripcion: ev.descripcion || undefined,
              hora: ev.hora || undefined,
              es_virtual: false,
            });
          }
        });
      } else {
        const fecha = new Date(ev.fecha_inicio + "T12:00:00");
        events.push({
          id: ev.id,
          titulo: ev.titulo,
          fecha,
          tipo: ev.tipo,
          color: ev.color || getColorForTipo(ev.tipo),
          modulo_origen: ev.modulo_origen,
          completado: ev.completado,
          descripcion: ev.descripcion || undefined,
          hora: ev.hora || undefined,
          es_virtual: false,
        });
      }
    });

    // Cuentas por pagar → virtual events
    cuentasPagar.forEach(cuenta => {
      if (cuenta.es_recurrente && cuenta.dia_vencimiento) {
        days.forEach(day => {
          if (day.getDate() === cuenta.dia_vencimiento) {
            events.push({
              id: `cp-${cuenta.id}-${format(day, "yyyy-MM-dd")}`,
              titulo: `💰 ${cuenta.nombre}`,
              fecha: day,
              tipo: "arriendo",
              color: "#ef4444",
              modulo_origen: "cuentas_pagar",
              completado: false,
              descripcion: `$${Number(cuenta.monto).toLocaleString()} - ${cuenta.categoria}`,
              es_virtual: true,
            });
          }
        });
      } else if (cuenta.fecha_vencimiento) {
        const fecha = new Date(cuenta.fecha_vencimiento + "T12:00:00");
        if (fecha >= monthStart && fecha <= monthEnd) {
          events.push({
            id: `cp-${cuenta.id}`,
            titulo: `💰 ${cuenta.nombre}`,
            fecha,
            tipo: "arriendo",
            color: "#ef4444",
            modulo_origen: "cuentas_pagar",
            completado: cuenta.estado === "pagada",
            descripcion: `$${Number(cuenta.monto).toLocaleString()} - ${cuenta.categoria}`,
            es_virtual: true,
          });
        }
      }
    });

    // Nómina → virtual events (quincenas: 15 y último día)
    if (empleados.length > 0) {
      const dia15 = days.find(d => d.getDate() === 15);
      const ultimoDia = days[days.length - 1];
      if (dia15) {
        events.push({
          id: `nom-q1-${format(dia15, "yyyy-MM")}`,
          titulo: `👥 Nómina Quincenal (1ra)`,
          fecha: dia15,
          tipo: "nomina",
          color: "#2563eb",
          modulo_origen: "nomina",
          completado: false,
          descripcion: `${empleados.length} empleados activos`,
          es_virtual: true,
        });
      }
      if (ultimoDia) {
        events.push({
          id: `nom-q2-${format(ultimoDia, "yyyy-MM")}`,
          titulo: `👥 Nómina Quincenal (2da)`,
          fecha: ultimoDia,
          tipo: "nomina",
          color: "#2563eb",
          modulo_origen: "nomina",
          completado: false,
          descripcion: `${empleados.length} empleados activos`,
          es_virtual: true,
        });
      }
    }

    return events;
  }, [manualEvents, cuentasPagar, empleados, currentMonth]);

  // ── Filtered events ────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    if (filterModulo === "todos") return allEvents;
    return allEvents.filter(e => e.modulo_origen === filterModulo);
  }, [allEvents, filterModulo]);

  const eventsForDate = useMemo(() =>
    filteredEvents.filter(e => isSameDay(e.fecha, selectedDate))
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
  , [filteredEvents, selectedDate]);

  // ── Upcoming alerts ────────────────────────────────────────────────────────
  const upcomingAlerts = useMemo(() => {
    const today = new Date();
    return filteredEvents.filter(e => {
      if (e.completado) return false;
      const daysUntil = Math.ceil((e.fecha.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 3;
    }).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }, [filteredEvents]);

  // ── Dates with events (for calendar dots) ──────────────────────────────────
  const datesWithEvents = useMemo(() => {
    const map = new Map<string, string[]>();
    filteredEvents.forEach(e => {
      const key = format(e.fecha, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e.color);
    });
    return map;
  }, [filteredEvents]);

  // ── CRUD mutations ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const payload = {
        user_id: user.id,
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        hora: form.hora || null,
        tipo: form.tipo,
        es_recurrente: form.es_recurrente,
        periodicidad: form.es_recurrente ? form.periodicidad : null,
        dia_recurrente: form.es_recurrente ? form.dia_recurrente : null,
        color: form.color,
        modulo_origen: "manual",
        alerta_dias_antes: form.alerta_dias_antes,
        notas: form.notas || null,
      };
      if (editingEvent) {
        const { error } = await supabase.from("calendario_eventos").update(payload).eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calendario_eventos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingEvent ? "Evento actualizado" : "Evento creado");
      qc.invalidateQueries({ queryKey: ["calendario-eventos"] });
      setShowDialog(false);
      setEditingEvent(null);
    },
    onError: () => toast.error("Error al guardar evento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendario_eventos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento eliminado");
      qc.invalidateQueries({ queryKey: ["calendario-eventos"] });
    },
  });

  const toggleCompletado = useMutation({
    mutationFn: async ({ id, completado }: { id: string; completado: boolean }) => {
      const { error } = await supabase.from("calendario_eventos").update({ completado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendario-eventos"] }),
  });

  // ── Export iCal ────────────────────────────────────────────────────────────
  const exportIcal = () => {
    let ical = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AnalogueCo//Calendario//ES\n";
    allEvents.forEach(ev => {
      const dtstart = format(ev.fecha, "yyyyMMdd");
      ical += `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${dtstart}\nSUMMARY:${ev.titulo}\n`;
      if (ev.descripcion) ical += `DESCRIPTION:${ev.descripcion}\n`;
      ical += `END:VEVENT\n`;
    });
    ical += "END:VCALENDAR";
    const blob = new Blob([ical], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendario-negocio-${format(currentMonth, "yyyy-MM")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendario exportado (.ics)");
  };

  // ── Open dialog ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingEvent(null);
    setForm({
      titulo: "", descripcion: "", fecha_inicio: format(selectedDate, "yyyy-MM-dd"),
      fecha_fin: "", hora: "", tipo: "otro", es_recurrente: false,
      periodicidad: "mensual", dia_recurrente: selectedDate.getDate(), color: "#6b7280",
      alerta_dias_antes: 1, notas: "",
    });
    setShowDialog(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setForm({
      titulo: ev.titulo, descripcion: ev.descripcion || "", fecha_inicio: ev.fecha_inicio,
      fecha_fin: ev.fecha_fin || "", hora: ev.hora || "", tipo: ev.tipo,
      es_recurrente: ev.es_recurrente, periodicidad: ev.periodicidad || "mensual",
      dia_recurrente: ev.dia_recurrente || 1, color: ev.color || "#6b7280",
      alerta_dias_antes: ev.alerta_dias_antes, notas: ev.notas || "",
    });
    setShowDialog(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendario del Negocio
          </h1>
          <p className="text-sm text-muted-foreground">Todas las actividades centralizadas en un solo lugar</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterModulo} onValueChange={setFilterModulo}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="manual">Manuales</SelectItem>
              <SelectItem value="cuentas_pagar">Cuentas × Pagar</SelectItem>
              <SelectItem value="nomina">Nómina</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportIcal}>
            <Download className="h-4 w-4 mr-1" /> iCal
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Evento
          </Button>
        </div>
      </div>

      {/* Upcoming alerts */}
      {upcomingAlerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold">Próximos eventos ({upcomingAlerts.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingAlerts.slice(0, 5).map(ev => (
                <Badge key={ev.id} variant="outline" className="gap-1" style={{ borderColor: ev.color, color: ev.color }}>
                  <Clock className="h-3 w-3" />
                  {ev.titulo} — {format(ev.fecha, "d MMM", { locale: es })}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={es}
              className="pointer-events-auto w-full"
              modifiers={{
                hasEvent: (date) => datesWithEvents.has(format(date, "yyyy-MM-dd")),
              }}
              modifiersStyles={{
                hasEvent: { fontWeight: 700, textDecoration: "underline", textDecorationColor: "hsl(var(--primary))", textUnderlineOffset: "4px" },
              }}
            />
            {/* Legend */}
            <div className="px-3 pb-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Leyenda</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPO_OPTIONS.map(t => (
                  <div key={t.value} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-[10px] text-muted-foreground">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
              {isToday(selectedDate) && <Badge className="bg-primary">Hoy</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {eventsForDate.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin eventos para este día</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar evento
                </Button>
              </div>
            ) : (
              eventsForDate.map(ev => {
                const Icon = MODULO_ICONS[ev.modulo_origen] || FileText;
                const realEvent = !ev.es_virtual ? manualEvents.find(m => m.id === ev.id) : null;
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border group hover:bg-muted/50 transition-colors">
                    <div className="w-1 h-full min-h-[40px] rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" style={{ color: ev.color }} />
                        <span className={`font-medium text-sm ${ev.completado ? "line-through opacity-60" : ""}`}>
                          {ev.titulo}
                        </span>
                        {ev.hora && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {ev.hora.slice(0, 5)}
                          </Badge>
                        )}
                      </div>
                      {ev.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{ev.descripcion}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ev.modulo_origen}</Badge>
                      </div>
                    </div>
                    {/* Actions for manual events */}
                    {realEvent && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => toggleCompletado.mutate({ id: realEvent.id, completado: !realEvent.completado })}>
                          <CheckCircle2 className={`h-4 w-4 ${realEvent.completado ? "text-green-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(realEvent)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(realEvent.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {ev.es_virtual && (
                      <Badge variant="outline" className="text-[10px] shrink-0">Auto</Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Pago arriendo local" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Hora (opcional)</Label>
                <Input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v, color: getColorForTipo(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alertar días antes</Label>
                <Input type="number" min={0} max={30} value={form.alerta_dias_antes} onChange={e => setForm({ ...form, alerta_dias_antes: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.es_recurrente} onCheckedChange={v => setForm({ ...form, es_recurrente: v })} />
              <Label>Evento recurrente</Label>
            </div>
            {form.es_recurrente && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Periodicidad</Label>
                  <Select value={form.periodicidad} onValueChange={v => setForm({ ...form, periodicidad: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Día del mes</Label>
                  <Input type="number" min={1} max={31} value={form.dia_recurrente} onChange={e => setForm({ ...form, dia_recurrente: Number(e.target.value) })} />
                </div>
              </div>
            )}
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.titulo || saveMutation.isPending}>
              {saveMutation.isPending ? "Guardando..." : editingEvent ? "Actualizar" : "Crear Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarioNegocio;
