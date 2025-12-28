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

  // Fetch ventas del día (ordenes_pos) con detalles para calcular utilidad bruta
  const { data: ventasHoy = [] } = useQuery({
    queryKey: ["ventas-hoy", hoy],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ordenes_pos")
        .select(`
          *,
          detalles:detalle_ordenes_pos(
            cantidad,
            precio_unitario,
            subtotal,
            menu_item_id
          )
        `)
        .eq("user_id", user.id)
        .gte("fecha", `${hoy}T00:00:00`)
        .lt("fecha", `${hoy}T23:59:59`);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch menu_items para obtener costo_promedio
  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items-costos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("menu_items")
        .select("id, costo_promedio, costo_unitario")
        .eq("user_id", user.id);

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

  // Fetch compras/entradas del día (costo de insumos de productos)
  const { data: entradasProductosHoy = [] } = useQuery({
    queryKey: ["entradas-productos-hoy", hoy],
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

  // Fetch entradas de inventario del menú del día
  const { data: entradasMenuHoy = [] } = useQuery({
    queryKey: ["entradas-menu-hoy", hoy],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("entradas_menu")
        .select(`
          *,
          detalles:detalle_entradas_menu(costo_total, menu_item:menu_items(nombre))
        `)
        .eq("user_id", user.id)
        .eq("fecha", hoy);

      if (error) throw error;
      return data || [];
    }
  });

  // Mapa de costos por menu_item_id
  const costosMap = useMemo(() => {
    const map: Record<string, number> = {};
    menuItems.forEach((item) => {
      const costo = Number(item.costo_promedio) || Number(item.costo_unitario) || 0;
      map[item.id] = costo;
    });
    return map;
  }, [menuItems]);

  // Calcular utilidad bruta por venta
  const ventasConUtilidad = useMemo(() => {
    return ventasHoy.map((venta) => {
      const detalles = venta.detalles || [];
      let costoTotal = 0;
      
      detalles.forEach((det: { cantidad: number; menu_item_id: string | null }) => {
        if (det.menu_item_id) {
          const costoUnitario = costosMap[det.menu_item_id] || 0;
          costoTotal += costoUnitario * det.cantidad;
        }
      });
      
      const utilidadBruta = Number(venta.total) - costoTotal;
      return {
        ...venta,
        costoTotal,
        utilidadBruta
      };
    });
  }, [ventasHoy, costosMap]);

  // Calcular totales
  const totales = useMemo(() => {
    const totalVentas = ventasConUtilidad.reduce((sum, v) => sum + Number(v.total || 0), 0);
    const totalUtilidadBruta = ventasConUtilidad.reduce((sum, v) => sum + v.utilidadBruta, 0);
    const totalGastosOperativos = gastosOperativos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
    
    // Costo de insumos de productos (entradas_inventario)
    const totalCostoProductos = entradasProductosHoy.reduce((sum, e) => {
      const costoEntrada = e.detalles?.reduce((s: number, d: { costo_total: number }) => s + Number(d.costo_total || 0), 0) || 0;
      return sum + costoEntrada;
    }, 0);

    // Costo de entradas del menú (entradas_menu)
    const totalCostoMenu = entradasMenuHoy.reduce((sum, e) => {
      const costoEntrada = e.detalles?.reduce((s: number, d: { costo_total: number }) => s + Number(d.costo_total || 0), 0) || 0;
      return sum + costoEntrada;
    }, 0);
    
    const totalCostoInsumos = totalCostoProductos + totalCostoMenu;
    const totalCostos = totalGastosOperativos + totalCostoInsumos;
    const utilidad = totalVentas - totalCostos;
    const margen = totalVentas > 0 ? (utilidad / totalVentas) * 100 : 0;
    const margenBruto = totalVentas > 0 ? (totalUtilidadBruta / totalVentas) * 100 : 0;

    return {
      totalVentas,
      totalUtilidadBruta,
      margenBruto,
      totalGastosOperativos,
      totalCostoInsumos,
      totalCostos,
      utilidad,
      margen,
      entradasCount: entradasProductosHoy.length + entradasMenuHoy.length
    };
  }, [ventasConUtilidad, gastosOperativos, entradasProductosHoy, entradasMenuHoy]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              {ventasConUtilidad.length} órdenes
            </p>
          </CardContent>
        </Card>

        <Card className={totales.totalUtilidadBruta >= 0 ? "border-blue-500/50" : "border-red-500/50"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totales.totalUtilidadBruta >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrency(totales.totalUtilidadBruta)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {totales.margenBruto.toFixed(1)}%
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
              {totales.entradasCount} compras
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

      {/* Ventas con utilidad bruta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ventas del Día - Utilidad Bruta</CardTitle>
        </CardHeader>
        <CardContent>
          {ventasConUtilidad.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No hay ventas registradas hoy
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden #</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Utilidad Bruta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasConUtilidad.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-medium">#{venta.numero_orden}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(venta.fecha), "HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(venta.total))}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(venta.costoTotal)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${venta.utilidadBruta >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      {formatCurrency(venta.utilidadBruta)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totales.totalVentas)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(ventasConUtilidad.reduce((sum, v) => sum + v.costoTotal, 0))}
                  </TableCell>
                  <TableCell className={`text-right ${totales.totalUtilidadBruta >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {formatCurrency(totales.totalUtilidadBruta)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
            {entradasProductosHoy.length === 0 && entradasMenuHoy.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay compras registradas hoy
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradasProductosHoy.map((entrada) => {
                    const costoTotal = entrada.detalles?.reduce(
                      (s: number, d: { costo_total: number }) => s + Number(d.costo_total || 0),
                      0
                    ) || 0;
                    return (
                      <TableRow key={entrada.id}>
                        <TableCell className="font-medium">Productos</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entrada.proveedor?.nombre || "Sin proveedor"}
                          {entrada.numero_factura_proveedor && ` - ${entrada.numero_factura_proveedor}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(costoTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {entradasMenuHoy.map((entrada) => {
                    const costoTotal = entrada.detalles?.reduce(
                      (s: number, d: { costo_total: number }) => s + Number(d.costo_total || 0),
                      0
                    ) || 0;
                    return (
                      <TableRow key={entrada.id}>
                        <TableCell className="font-medium">Menú</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entrada.notas || "Entrada de inventario"}
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
