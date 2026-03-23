import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Banknote,
  MoreHorizontal,
  History,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type SesionCaja = {
  id: string;
  user_id: string;
  estado: string;
  monto_apertura: number;
  monto_cierre: number | null;
  total_ventas: number | null;
  total_efectivo: number | null;
  total_tarjeta: number | null;
  total_otros: number | null;
  diferencia: number | null;
  notas_apertura: string | null;
  notas_cierre: string | null;
  abierta_por: string | null;
  cerrada_por: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  created_at: string;
};

const formatCOP = (val: number | null | undefined) => {
  if (val == null) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
};

const formatDuracion = (apertura: string, cierre: string | null) => {
  const start = new Date(apertura);
  const end = cierre ? new Date(cierre) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return `${h}h ${m}m`;
};

const AbrirCaja = () => {
  const queryClient = useQueryClient();
  const [userName, setUserName] = useState("");

  // Dialogs
  const [showAbrirDialog, setShowAbrirDialog] = useState(false);
  const [showCerrarDialog, setShowCerrarDialog] = useState(false);
  const [showPinCerrar, setShowPinCerrar] = useState(false);

  // Form apertura
  const [montoApertura, setMontoApertura] = useState("");
  const [notasApertura, setNotasApertura] = useState("");

  // Form cierre
  const [efectivoCierre, setEfectivoCierre] = useState("");
  const [tarjetaCierre, setTarjetaCierre] = useState("");
  const [otrosCierre, setOtrosCierre] = useState("");
  const [notasCierre, setNotasCierre] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.email?.split("@")[0] || "usuario");
    });
  }, []);

  // Sesión activa
  const { data: sesionActiva, isLoading: loadingActiva } = useQuery({
    queryKey: ["sesion-caja-activa"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("sesiones_caja")
        .select("*")
        .eq("user_id", user.id)
        .eq("estado", "abierta")
        .order("fecha_apertura", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SesionCaja | null;
    },
    refetchInterval: 30000,
  });

  // Historial de sesiones
  const { data: historial } = useQuery({
    queryKey: ["sesiones-caja-historial"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("sesiones_caja")
        .select("*")
        .eq("user_id", user.id)
        .order("fecha_apertura", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as SesionCaja[];
    },
  });

  // Ventas de hoy (para corroborar con cierre)
  const { data: ventasHoy } = useQuery({
    queryKey: ["ventas-hoy-caja"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, count: 0 };
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("ordenes_pos")
        .select("total")
        .eq("user_id", user.id)
        .gte("fecha", hoy.toISOString());
      if (error) throw error;
      const total = data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      return { total, count: data?.length ?? 0 };
    },
  });

  // Mutation abrir caja
  const abrirCajaMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { error } = await (supabase as any).from("sesiones_caja").insert({
        user_id: user.id,
        estado: "abierta",
        monto_apertura: parseFloat(montoApertura) || 0,
        notas_apertura: notasApertura || null,
        abierta_por: userName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sesion-caja-activa"] });
      queryClient.invalidateQueries({ queryKey: ["sesiones-caja-historial"] });
      toast.success("✅ Caja abierta correctamente");
      setShowAbrirDialog(false);
      setMontoApertura("");
      setNotasApertura("");
    },
    onError: () => toast.error("Error al abrir caja"),
  });

  // Mutation cerrar caja
  const cerrarCajaMutation = useMutation({
    mutationFn: async () => {
      if (!sesionActiva) throw new Error("No hay caja activa");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const efectivo = parseFloat(efectivoCierre) || 0;
      const tarjeta = parseFloat(tarjetaCierre) || 0;
      const otros = parseFloat(otrosCierre) || 0;
      const totalContado = efectivo + tarjeta + otros;
      const totalSistema = ventasHoy?.total ?? 0;
      const diferencia = totalContado - totalSistema;

      const { error } = await (supabase as any)
        .from("sesiones_caja")
        .update({
          estado: "cerrada",
          monto_cierre: totalContado,
          total_ventas: totalSistema,
          total_efectivo: efectivo,
          total_tarjeta: tarjeta,
          total_otros: otros,
          diferencia,
          notas_cierre: notasCierre || null,
          cerrada_por: userName,
          fecha_cierre: new Date().toISOString(),
        })
        .eq("id", sesionActiva.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sesion-caja-activa"] });
      queryClient.invalidateQueries({ queryKey: ["sesiones-caja-historial"] });
      toast.success("🔒 Caja cerrada y arqueo guardado");
      setShowCerrarDialog(false);
      setEfectivoCierre("");
      setTarjetaCierre("");
      setOtrosCierre("");
      setNotasCierre("");
    },
    onError: () => toast.error("Error al cerrar caja"),
  });

  // Calcular diferencia en tiempo real durante cierre
  const totalContadoCierre =
    (parseFloat(efectivoCierre) || 0) +
    (parseFloat(tarjetaCierre) || 0) +
    (parseFloat(otrosCierre) || 0);
  const diferenciaCierre = totalContadoCierre - (ventasHoy?.total ?? 0);

  const cajaAbierta = !!sesionActiva;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-primary" />
            Control de Caja
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Apertura, cierre y arqueo diario
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["sesion-caja-activa"] });
            queryClient.invalidateQueries({ queryKey: ["ventas-hoy-caja"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estado actual de caja */}
      <Card className={`border-2 ${cajaAbierta ? "border-green-500/50 bg-green-500/5" : "border-muted"}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center ${cajaAbierta ? "bg-green-500/20" : "bg-muted"}`}>
                {cajaAbierta ? (
                  <Unlock className="h-7 w-7 text-green-600" />
                ) : (
                  <Lock className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">
                    {cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
                  </span>
                  <Badge variant={cajaAbierta ? "default" : "secondary"} className={cajaAbierta ? "bg-green-500" : ""}>
                    {cajaAbierta ? "ACTIVA" : "INACTIVA"}
                  </Badge>
                </div>
                {cajaAbierta && sesionActiva ? (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Apertura: {format(new Date(sesionActiva.fecha_apertura), "dd MMM yyyy HH:mm", { locale: es })}
                    {" · "}Abierta hace {formatDuracion(sesionActiva.fecha_apertura, null)}
                    {sesionActiva.abierta_por && ` · por ${sesionActiva.abierta_por}`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    No hay sesión activa. Abre la caja para comenzar a operar.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {!cajaAbierta ? (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowAbrirDialog(true)}
                  disabled={loadingActiva}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caja
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setShowCerrarDialog(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Cerrar Caja
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs de la sesión actual + ventas hoy */}
      {cajaAbierta && sesionActiva && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Base Apertura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCOP(sesionActiva.monto_apertura)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Ventas del Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCOP(ventasHoy?.total)}</div>
              <p className="text-xs text-muted-foreground">{ventasHoy?.count ?? 0} órdenes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">En Caja Estimado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCOP((sesionActiva.monto_apertura ?? 0) + (ventasHoy?.total ?? 0))}
              </div>
              <p className="text-xs text-muted-foreground">Base + ventas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Duración Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuracion(sesionActiva.fecha_apertura, null)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Desde {format(new Date(sesionActiva.fecha_apertura), "HH:mm")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cajas
          </CardTitle>
          <CardDescription>Últimas 20 sesiones de caja</CardDescription>
        </CardHeader>
        <CardContent>
          {!historial || historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <DollarSign className="h-10 w-10 opacity-30" />
              <p className="text-sm">No hay sesiones registradas aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Ventas Sistema</TableHead>
                    <TableHead className="text-right">Contado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((s) => {
                    const dif = s.diferencia ?? null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge
                            variant={s.estado === "abierta" ? "default" : "secondary"}
                            className={s.estado === "abierta" ? "bg-green-500 text-white" : ""}
                          >
                            {s.estado === "abierta" ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" />Abierta</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />Cerrada</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(s.fecha_apertura), "dd/MM/yy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.fecha_cierre
                            ? format(new Date(s.fecha_cierre), "dd/MM/yy HH:mm", { locale: es })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDuracion(s.fecha_apertura, s.fecha_cierre)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {formatCOP(s.monto_apertura)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {formatCOP(s.total_ventas)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {formatCOP(s.monto_cierre)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {dif == null ? "—" : (
                            <span className={Math.abs(dif) < 1 ? "text-green-600" : dif > 0 ? "text-blue-600" : "text-destructive"}>
                              {dif > 0 ? "+" : ""}{formatCOP(dif)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.abierta_por ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== DIALOG: ABRIR CAJA ===== */}
      <Dialog open={showAbrirDialog} onOpenChange={setShowAbrirDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Abrir Caja
            </DialogTitle>
            <DialogDescription>
              Registra el dinero base con el que inicia el turno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="montoApertura" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Monto de Apertura (base de caja)
              </Label>
              <Input
                id="montoApertura"
                type="number"
                min="0"
                placeholder="Ej: 50000"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                className="text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Dinero en efectivo con el que arranca la caja hoy
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notasApertura">Notas (opcional)</Label>
              <Textarea
                id="notasApertura"
                placeholder="Observaciones de apertura..."
                value={notasApertura}
                onChange={(e) => setNotasApertura(e.target.value)}
                rows={2}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Resumen de apertura</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abre:</span>
                <span>{userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora:</span>
                <span>{format(new Date(), "HH:mm dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Base de caja:</span>
                <span className="text-green-600">{formatCOP(parseFloat(montoApertura) || 0)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirDialog(false)}>Cancelar</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => abrirCajaMutation.mutate()}
              disabled={abrirCajaMutation.isPending}
            >
              {abrirCajaMutation.isPending ? "Abriendo..." : "Abrir Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: CERRAR CAJA ===== */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              Cerrar Caja — Arqueo
            </DialogTitle>
            <DialogDescription>
              Cuenta el dinero físico y registra el cierre del turno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Referencia sistema */}
            <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
              <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">Según el sistema</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ventas del día:</span>
                  <span className="font-medium text-green-600">{formatCOP(ventasHoy?.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Órdenes:</span>
                  <span className="font-medium">{ventasHoy?.count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base apertura:</span>
                  <span className="font-medium">{formatCOP(sesionActiva?.monto_apertura)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total esperado:</span>
                  <span className="font-semibold">{formatCOP((sesionActiva?.monto_apertura ?? 0) + (ventasHoy?.total ?? 0))}</span>
                </div>
              </div>
            </div>

            <Separator />

            <p className="text-sm font-medium">Dinero contado físicamente</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="efectivo" className="flex items-center gap-1 text-xs">
                  <Banknote className="h-3.5 w-3.5" />Efectivo
                </Label>
                <Input
                  id="efectivo"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={efectivoCierre}
                  onChange={(e) => setEfectivoCierre(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tarjeta" className="flex items-center gap-1 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />Tarjeta
                </Label>
                <Input
                  id="tarjeta"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={tarjetaCierre}
                  onChange={(e) => setTarjetaCierre(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="otros" className="flex items-center gap-1 text-xs">
                  <MoreHorizontal className="h-3.5 w-3.5" />Otros
                </Label>
                <Input
                  id="otros"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={otrosCierre}
                  onChange={(e) => setOtrosCierre(e.target.value)}
                />
              </div>
            </div>

            {/* Resumen diferencia */}
            <div className={`rounded-lg p-4 border-2 ${Math.abs(diferenciaCierre) < 1 ? "border-green-500/50 bg-green-500/5" : Math.abs(diferenciaCierre) < 5000 ? "border-yellow-500/50 bg-yellow-500/5" : "border-destructive/50 bg-destructive/5"}`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Total contado:</span>
                  <span className="font-bold text-lg">{formatCOP(totalContadoCierre)}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Total ventas sistema:</span>
                  <span className="font-medium">{formatCOP(ventasHoy?.total)}</span>
                </div>
                <Separator className="col-span-2" />
                <div className="flex justify-between col-span-2 font-bold">
                  <span className="flex items-center gap-1">
                    {Math.abs(diferenciaCierre) < 1 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    Diferencia:
                  </span>
                  <span className={Math.abs(diferenciaCierre) < 1 ? "text-green-600" : diferenciaCierre > 0 ? "text-blue-600" : "text-destructive"}>
                    {diferenciaCierre >= 0 ? "+" : ""}{formatCOP(diferenciaCierre)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notasCierre">Notas de cierre (opcional)</Label>
              <Textarea
                id="notasCierre"
                placeholder="Observaciones, incidencias..."
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => cerrarCajaMutation.mutate()}
              disabled={cerrarCajaMutation.isPending}
            >
              {cerrarCajaMutation.isPending ? "Cerrando..." : "Confirmar Cierre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbrirCaja;
