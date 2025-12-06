import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Package, AlertTriangle, ChefHat, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { AIAssistant } from "@/components/AIAssistant";

type MovimientoInventario = {
  id: string;
  fecha: string;
  tipo_movimiento: string;
  cantidad: number;
  producto_id: string;
  productos: {
    nombre: string;
  };
};

type Producto = {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad_inventario: string;
  tipo_producto: string;
};

const Dashboard = () => {
  // Fetch movimientos últimos 30 días
  const { data: movimientos } = useQuery({
    queryKey: ["dashboard-movimientos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const thirtyDaysAgo = subDays(new Date(), 30);

      const { data, error } = await supabase
        .from("movimientos_inventario")
        .select(`
          *,
          productos (
            nombre
          )
        `)
        .eq("user_id", user.id)
        .gte("fecha", thirtyDaysAgo.toISOString())
        .order("fecha", { ascending: true });

      if (error) throw error;
      return data as MovimientoInventario[];
    },
  });

  // Fetch productos con stock bajo
  const { data: productosStockBajo } = useQuery({
    queryKey: ["dashboard-stock-bajo"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .order("stock_actual", { ascending: true });

      if (error) throw error;
      
      const productos = data as Producto[];
      return productos.filter(p => p.stock_actual <= p.stock_minimo);
    },
  });

  // Fetch consumos por receta (últimos 30 días)
  const { data: consumosPorReceta } = useQuery({
    queryKey: ["dashboard-consumos-receta"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const thirtyDaysAgo = subDays(new Date(), 30);

      const { data, error } = await supabase
        .from("movimientos_inventario")
        .select(`
          *,
          productos (
            nombre,
            unidad_inventario
          )
        `)
        .eq("user_id", user.id)
        .eq("tipo_movimiento", "consumo")
        .gte("fecha", thirtyDaysAgo.toISOString());

      if (error) throw error;
      
      return data;
    },
  });

  // Get completed orders from localStorage for sales stats
  const completedOrders = useMemo(() => {
    const saved = localStorage.getItem('completedOrders');
    if (!saved) return [];
    return JSON.parse(saved);
  }, []);

  // Calculate productos más vendidos
  const productosMasVendidos = useMemo(() => {
    const productCount: Record<string, number> = {};
    
    completedOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        productCount[item.name] = (productCount[item.name] || 0) + 1;
      });
    });

    return Object.entries(productCount)
      .map(([name, count]) => ({ name, cantidad: count }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [completedOrders]);

  // Calculate ventas totales
  const ventasTotales = useMemo(() => {
    return completedOrders.reduce((sum: number, order: any) => sum + order.total, 0);
  }, [completedOrders]);

  // Movimientos por tipo (últimos 30 días)
  const movimientosPorTipo = useMemo(() => {
    if (!movimientos) return [];

    const tipos: Record<string, number> = {
      entrada: 0,
      salida_venta: 0,
      ajuste: 0,
      consumo: 0,
    };

    movimientos.forEach((mov) => {
      tipos[mov.tipo_movimiento] = (tipos[mov.tipo_movimiento] || 0) + 1;
    });

    return [
      { tipo: "Entradas", cantidad: tipos.entrada, color: "#10b981" },
      { tipo: "Salidas/Ventas", cantidad: tipos.salida_venta, color: "#ef4444" },
      { tipo: "Ajustes", cantidad: tipos.ajuste, color: "#f59e0b" },
      { tipo: "Consumos", cantidad: tipos.consumo, color: "#8b5cf6" },
    ];
  }, [movimientos]);

  // Movimientos por día (últimos 7 días)
  const movimientosPorDia = useMemo(() => {
    if (!movimientos) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        fecha: format(date, "dd/MM", { locale: es }),
        entradas: 0,
        salidas: 0,
        consumos: 0,
      };
    });

    movimientos.forEach((mov) => {
      const movDate = new Date(mov.fecha);
      const dayIndex = last7Days.findIndex((day) => {
        const targetDate = subDays(new Date(), 6 - last7Days.indexOf(day));
        return (
          movDate >= startOfDay(targetDate) &&
          movDate <= endOfDay(targetDate)
        );
      });

      if (dayIndex !== -1) {
        if (mov.tipo_movimiento === "entrada") {
          last7Days[dayIndex].entradas += mov.cantidad;
        } else if (mov.tipo_movimiento === "salida_venta") {
          last7Days[dayIndex].salidas += mov.cantidad;
        } else if (mov.tipo_movimiento === "consumo") {
          last7Days[dayIndex].consumos += mov.cantidad;
        }
      }
    });

    return last7Days;
  }, [movimientos]);

  // Top 5 insumos más consumidos
  const insumosTopConsumo = useMemo(() => {
    if (!consumosPorReceta) return [];

    const consumosPorInsumo: Record<string, { nombre: string; total: number; unidad: string }> = {};

    consumosPorReceta.forEach((mov: any) => {
      const key = mov.producto_id;
      if (!consumosPorInsumo[key]) {
        consumosPorInsumo[key] = {
          nombre: mov.productos.nombre,
          total: 0,
          unidad: mov.productos.unidad_inventario,
        };
      }
      consumosPorInsumo[key].total += mov.cantidad;
    });

    return Object.values(consumosPorInsumo)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [consumosPorReceta]);

  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Dashboard de Análisis
          </h1>
          <p className="text-muted-foreground">Métricas de inventario, ventas y consumos</p>
        </div>
        <div className="lg:w-[450px]">
          <AIAssistant />
        </div>
      </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${ventasTotales.toLocaleString("es-CO")}
              </div>
              <p className="text-xs text-muted-foreground">
                {completedOrders.length} órdenes completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {productosStockBajo?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos por debajo del mínimo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimientos (30d)</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {movimientos?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumos Recetas</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consumosPorReceta?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Movimientos de consumo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Stock Bajo */}
        {productosStockBajo && productosStockBajo.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>¡Atención!</strong> Hay {productosStockBajo.length} producto(s) con stock bajo o agotado.
            </AlertDescription>
          </Alert>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Movimientos por Día */}
          <Card>
            <CardHeader>
              <CardTitle>Movimientos Últimos 7 Días</CardTitle>
              <CardDescription>Entradas, salidas y consumos diarios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={movimientosPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" stroke="#10b981" name="Entradas" />
                  <Line type="monotone" dataKey="salidas" stroke="#ef4444" name="Salidas" />
                  <Line type="monotone" dataKey="consumos" stroke="#8b5cf6" name="Consumos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Movimientos por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Movimientos</CardTitle>
              <CardDescription>Por tipo (últimos 30 días)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={movimientosPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.tipo}: ${entry.cantidad}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="cantidad"
                  >
                    {movimientosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productos Más Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
              <CardDescription>Según órdenes completadas en el POS</CardDescription>
            </CardHeader>
            <CardContent>
              {productosMasVendidos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productosMasVendidos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#10b981" name="Unidades Vendidas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos de ventas disponibles
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Insumos Consumidos */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Insumos Más Consumidos</CardTitle>
              <CardDescription>Por recetas preparadas (últimos 30 días)</CardDescription>
            </CardHeader>
            <CardContent>
              {insumosTopConsumo.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insumosTopConsumo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8b5cf6" name="Cantidad Consumida" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos de consumo disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productos con Stock Bajo */}
        {productosStockBajo && productosStockBajo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Productos con Stock Bajo
              </CardTitle>
              <CardDescription>
                Productos que están por debajo o en el stock mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {productosStockBajo.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {producto.tipo_producto === "retail" ? "Insumo" : "Preparado"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {producto.stock_actual} {producto.unidad_inventario}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mínimo: {producto.stock_minimo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default Dashboard;
