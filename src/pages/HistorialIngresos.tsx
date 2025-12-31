import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Trash2, Package, Coffee, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

interface EntradaMenu {
  id: string;
  fecha: string;
  valor_total: number;
  notas: string | null;
  created_at: string;
  detalles: {
    id: string;
    cantidad: number;
    costo_unitario: number;
    costo_total: number;
    menu_item: {
      nombre: string;
    } | null;
  }[];
}

interface EntradaInventario {
  id: string;
  fecha_compra: string;
  valor_total_factura: number | null;
  notas: string | null;
  numero_factura_proveedor: string | null;
  created_at: string;
  proveedor: {
    nombre: string;
  } | null;
  detalles: {
    id: string;
    cantidad: number;
    costo_unitario: number;
    costo_total: number;
    producto: {
      nombre: string;
    } | null;
  }[];
}

export default function HistorialIngresos() {
  const scrollPositionRef = useRef(0);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [entryToDelete, setEntryToDelete] = useState<{ id: string; type: 'menu' | 'inventario'; total: number } | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const openPinDialog = () => {
    scrollPositionRef.current = window.scrollY;
    setShowPinDialog(true);
  };

  const closePinDialog = () => {
    setShowPinDialog(false);
    requestAnimationFrame(() => window.scrollTo(0, scrollPositionRef.current));
  };

  // Fetch entradas de menú
  const { data: entradasMenu = [], isLoading: loadingMenu } = useQuery({
    queryKey: ["entradas-menu-historial", dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("entradas_menu")
        .select(`
          *,
          detalles:detalle_entradas_menu(
            id, cantidad, costo_unitario, costo_total,
            menu_item:menu_items(nombre)
          )
        `)
        .eq("user_id", user.id)
        .gte("fecha", format(dateRange.from, "yyyy-MM-dd"))
        .lte("fecha", format(dateRange.to, "yyyy-MM-dd"))
        .order("fecha", { ascending: false });

      if (error) throw error;
      return (data || []) as EntradaMenu[];
    },
  });

  // Fetch entradas de inventario (insumos)
  const { data: entradasInventario = [], isLoading: loadingInventario } = useQuery({
    queryKey: ["entradas-inventario-historial", dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("entradas_inventario")
        .select(`
          *,
          proveedor:proveedores(nombre),
          detalles:detalle_entradas(
            id, cantidad, costo_unitario, costo_total,
            producto:productos(nombre)
          )
        `)
        .eq("user_id", user.id)
        .gte("fecha_compra", format(dateRange.from, "yyyy-MM-dd"))
        .lte("fecha_compra", format(dateRange.to, "yyyy-MM-dd"))
        .order("fecha_compra", { ascending: false });

      if (error) throw error;
      return (data || []) as EntradaInventario[];
    },
  });

  // Mutation para eliminar entrada de menú
  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      // Primero eliminar detalles
      const { error: detailError } = await supabase
        .from("detalle_entradas_menu")
        .delete()
        .eq("entrada_id", id);
      
      if (detailError) throw detailError;

      // Luego eliminar entrada
      const { error } = await supabase
        .from("entradas_menu")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas-menu-historial"] });
      toast.success("Entrada eliminada correctamente");
    },
    onError: () => {
      toast.error("Error al eliminar la entrada");
    },
  });

  // Mutation para eliminar entrada de inventario
  const deleteInventarioMutation = useMutation({
    mutationFn: async (id: string) => {
      // Primero eliminar detalles
      const { error: detailError } = await supabase
        .from("detalle_entradas")
        .delete()
        .eq("entrada_id", id);
      
      if (detailError) throw detailError;

      // Luego eliminar entrada
      const { error } = await supabase
        .from("entradas_inventario")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas-inventario-historial"] });
      toast.success("Entrada eliminada correctamente");
    },
    onError: () => {
      toast.error("Error al eliminar la entrada");
    },
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const handleDeleteClick = (id: string, type: 'menu' | 'inventario', total: number) => {
    setEntryToDelete({ id, type, total });
    openPinDialog();
  };

  const handlePinSuccess = () => {
    if (entryToDelete) {
      if (entryToDelete.type === 'menu') {
        deleteMenuMutation.mutate(entryToDelete.id);
      } else {
        deleteInventarioMutation.mutate(entryToDelete.id);
      }
      setEntryToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const isLoading = loadingMenu || loadingInventario;

  // Combinar y ordenar todas las entradas por fecha
  const allEntries = [
    ...entradasMenu.map((e) => ({
      ...e,
      type: 'menu' as const,
      fecha: e.fecha,
      total: e.valor_total,
    })),
    ...entradasInventario.map((e) => ({
      ...e,
      type: 'inventario' as const,
      fecha: e.fecha_compra,
      total: e.valor_total_factura || e.detalles.reduce((sum, d) => sum + d.costo_total, 0),
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalGeneral = allEntries.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Historial de Ingresos</h1>
          <p className="text-muted-foreground">
            Revisa y gestiona los ingresos de inventario
          </p>
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "dd MMM", { locale: es })} - {format(dateRange.to, "dd MMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  } else if (range?.from) {
                    setDateRange({ from: range.from, to: range.from });
                  }
                }}
                locale={es}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Ingresos Menú
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(entradasMenu.reduce((sum, e) => sum + e.valor_total, 0))}
            </div>
            <p className="text-xs text-muted-foreground">{entradasMenu.length} entradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ingresos Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(entradasInventario.reduce((sum, e) => 
                sum + (e.valor_total_factura || e.detalles.reduce((s, d) => s + d.costo_total, 0)), 0
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{entradasInventario.length} entradas</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalGeneral)}
            </div>
            <p className="text-xs text-muted-foreground">{allEntries.length} entradas totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de entradas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : allEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay ingresos en el período seleccionado
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEntries.map((entry) => (
                    <>
                      <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpanded(entry.id)}
                          >
                            {expandedEntries.has(entry.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.fecha), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.type === 'menu' ? 'default' : 'secondary'}>
                            {entry.type === 'menu' ? (
                              <><Coffee className="h-3 w-3 mr-1" /> Menú</>
                            ) : (
                              <><Package className="h-3 w-3 mr-1" /> Insumos</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.type === 'menu' 
                            ? (entry as EntradaMenu).notas || `${(entry as EntradaMenu).detalles.length} items`
                            : (entry as EntradaInventario).proveedor?.nombre || 'Sin proveedor'
                          }
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(entry.id, entry.type, entry.total)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedEntries.has(entry.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Detalles:</p>
                              <div className="grid gap-1">
                                {entry.type === 'menu' 
                                  ? (entry as EntradaMenu).detalles.map((d) => (
                                      <div key={d.id} className="flex justify-between text-sm">
                                        <span>{d.menu_item?.nombre || 'Item eliminado'} x{d.cantidad}</span>
                                        <span>{formatCurrency(d.costo_total)}</span>
                                      </div>
                                    ))
                                  : (entry as EntradaInventario).detalles.map((d) => (
                                      <div key={d.id} className="flex justify-between text-sm">
                                        <span>{d.producto?.nombre || 'Producto eliminado'} x{d.cantidad}</span>
                                        <span>{formatCurrency(d.costo_total)}</span>
                                      </div>
                                    ))
                                }
                              </div>
                              {entry.type === 'inventario' && (entry as EntradaInventario).numero_factura_proveedor && (
                                <p className="text-xs text-muted-foreground">
                                  Factura: {(entry as EntradaInventario).numero_factura_proveedor}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* PIN Verification Dialog */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={(open) => {
          if (!open) closePinDialog();
          else openPinDialog();
        }}
        onSuccess={handlePinSuccess}
        title="Eliminar Ingreso"
        description={`Ingresa tu PIN para eliminar este ingreso de ${entryToDelete ? formatCurrency(entryToDelete.total) : ''}`}
      />
    </div>
  );
}