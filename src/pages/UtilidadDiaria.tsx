import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Receipt, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS_GASTOS = [
  "Arriendo",
  "Servicios públicos",
  "Nómina",
  "Transporte",
  "Marketing",
  "Mantenimiento",
  "Otros"
];

export default function UtilidadDiaria() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({
    categoria: "",
    descripcion: "",
    monto: ""
  });

  const hoy = format(new Date(), "yyyy-MM-dd");
  const hoyDisplay = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  // Fetch ventas del día (ordenes_pos)
  const { data: ventasHoy = [] } = useQuery({
    queryKey: ["ventas-hoy", hoy],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ordenes_pos")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", `${hoy}T00:00:00`)
        .lt("fecha", `${hoy}T23:59:59`);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch gastos operativos del día
  const { data: gastosOperativos = [] } = useQuery({
    queryKey: ["gastos-operativos", hoy],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("gastos_operativos")
        .select("*")
        .eq("user_id", user.id)
        .eq("fecha", hoy);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch compras/entradas del día (costo de insumos)
  const { data: entradasHoy = [] } = useQuery({
    queryKey: ["entradas-hoy", hoy],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("entradas_inventario")
        .select(`
          *,
          proveedor:proveedores(nombre),
          detalles:detalle_entradas(costo_total)
        `)
        .eq("user_id", user.id)
        .eq("fecha_compra", hoy);

      if (error) throw error;
      return data || [];
    }
  });

  // Calcular totales
  const totales = useMemo(() => {
    const totalVentas = ventasHoy.reduce((sum, v) => sum + Number(v.total || 0), 0);
    const totalGastosOperativos = gastosOperativos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
    const totalCostoInsumos = entradasHoy.reduce((sum, e) => {
      const costoEntrada = e.detalles?.reduce((s: number, d: { costo_total: number }) => s + Number(d.costo_total || 0), 0) || 0;
      return sum + costoEntrada;
    }, 0);
    
    const totalCostos = totalGastosOperativos + totalCostoInsumos;
    const utilidad = totalVentas - totalCostos;
    const margen = totalVentas > 0 ? (utilidad / totalVentas) * 100 : 0;

    return {
      totalVentas,
      totalGastosOperativos,
      totalCostoInsumos,
      totalCostos,
      utilidad,
      margen
    };
  }, [ventasHoy, gastosOperativos, entradasHoy]);

  // Mutation para agregar gasto
  const agregarGastoMutation = useMutation({
    mutationFn: async (gasto: typeof nuevoGasto) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("gastos_operativos").insert({
        user_id: user.id,
        categoria: gasto.categoria,
        descripcion: gasto.descripcion || null,
        monto: parseFloat(gasto.monto),
        fecha: hoy
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos-operativos"] });
      setNuevoGasto({ categoria: "", descripcion: "", monto: "" });
      setIsDialogOpen(false);
      toast.success("Gasto registrado");
    },
    onError: () => {
      toast.error("Error al registrar gasto");
    }
  });

  // Mutation para eliminar gasto
  const eliminarGastoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gastos_operativos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos-operativos"] });
      toast.success("Gasto eliminado");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGasto.categoria || !nuevoGasto.monto) {
      toast.error("Completa los campos requeridos");
      return;
    }
    agregarGastoMutation.mutate(nuevoGasto);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilidad del Día</h1>
          <p className="text-muted-foreground capitalize">{hoyDisplay}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Gasto Operativo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={nuevoGasto.categoria}
                  onValueChange={(v) => setNuevoGasto(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_GASTOS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input
                  type="number"
                  value={nuevoGasto.monto}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <Button type="submit" className="w-full" disabled={agregarGastoMutation.isPending}>
                Guardar Gasto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totales.totalVentas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {ventasHoy.length} órdenes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totales.totalGastosOperativos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {gastosOperativos.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Insumos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totales.totalCostoInsumos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {entradasHoy.length} compras
            </p>
          </CardContent>
        </Card>

        <Card className={totales.utilidad >= 0 ? "border-green-500/50" : "border-red-500/50"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
            {totales.utilidad >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totales.utilidad >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totales.utilidad)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {totales.margen.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de costos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos operativos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            {gastosOperativos.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay gastos registrados hoy
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastosOperativos.map((gasto) => (
                    <TableRow key={gasto.id}>
                      <TableCell className="font-medium">{gasto.categoria}</TableCell>
                      <TableCell className="text-muted-foreground">{gasto.descripcion || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(gasto.monto))}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarGastoMutation.mutate(gasto.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Compras de insumos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compras de Insumos</CardTitle>
          </CardHeader>
          <CardContent>
            {entradasHoy.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay compras registradas hoy
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradasHoy.map((entrada) => {
                    const costoTotal = entrada.detalles?.reduce(
                      (s: number, d: { costo_total: number }) => s + Number(d.costo_total || 0),
                      0
                    ) || 0;
                    return (
                      <TableRow key={entrada.id}>
                        <TableCell className="font-medium">
                          {entrada.proveedor?.nombre || "Sin proveedor"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entrada.numero_factura_proveedor || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(costoTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
