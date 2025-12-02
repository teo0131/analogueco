import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const HistorialMovimientos = () => {
  const navigate = useNavigate();
  const [selectedProducto, setSelectedProducto] = useState<string>("all");
  const [selectedTipo, setSelectedTipo] = useState<string>("all");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Fetch productos for filter
  const { data: productos } = useQuery({
    queryKey: ["productos-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre")
        .eq("es_activo", true)
        .order("nombre");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch movimientos with filters
  const { data: movimientos, isLoading } = useQuery({
    queryKey: ["movimientos-inventario", selectedProducto, selectedTipo, fechaInicio, fechaFin],
    queryFn: async () => {
      let query = supabase
        .from("movimientos_inventario")
        .select(`
          *,
          productos (
            nombre,
            unidad_inventario
          )
        `)
        .order("fecha", { ascending: false });

      if (selectedProducto !== "all") {
        query = query.eq("producto_id", selectedProducto);
      }

      if (selectedTipo !== "all") {
        query = query.eq("tipo_movimiento", selectedTipo as any);
      }

      if (fechaInicio) {
        query = query.gte("fecha", fechaInicio);
      }

      if (fechaFin) {
        query = query.lte("fecha", `${fechaFin}T23:59:59`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const clearFilters = () => {
    setSelectedProducto("all");
    setSelectedTipo("all");
    setFechaInicio("");
    setFechaFin("");
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      entrada: "Entrada",
      salida_venta: "Salida (Venta)",
      ajuste: "Ajuste",
      consumo: "Consumo",
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "default";
      case "salida_venta":
        return "destructive";
      case "ajuste":
        return "secondary";
      case "consumo":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Historial de Movimientos</h1>
              <p className="text-muted-foreground">Kardex de inventario</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto</label>
                <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                    {productos?.map((producto) => (
                      <SelectItem key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de movimiento</label>
                <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida_venta">Salida (Venta)</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                    <SelectItem value="consumo">Consumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha inicio
                </label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha fin
                </label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Movimientos ({movimientos?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Stock Resultante</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Cargando movimientos...
                      </TableCell>
                    </TableRow>
                  ) : movimientos && movimientos.length > 0 ? (
                    movimientos.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(movimiento.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movimiento.productos?.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTipoBadgeVariant(movimiento.tipo_movimiento)}>
                            {getTipoLabel(movimiento.tipo_movimiento)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {movimiento.tipo_movimiento === "salida_venta" || movimiento.tipo_movimiento === "consumo" ? "-" : "+"}
                          {movimiento.cantidad} {movimiento.productos?.unidad_inventario}
                        </TableCell>
                        <TableCell className="text-right">
                          {movimiento.costo_unitario_referencia
                            ? `$${Number(movimiento.costo_unitario_referencia).toLocaleString("es-CO")}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {movimiento.stock_resultante} {movimiento.productos?.unidad_inventario}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movimiento.referencia || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {movimiento.notas || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron movimientos con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistorialMovimientos;