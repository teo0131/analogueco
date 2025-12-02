import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, ChefHat, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Producto = {
  id: string;
  nombre: string;
  tipo_producto: string;
  unidad_inventario: string;
  stock_actual: number;
};

type Receta = {
  id: string;
  producto_final_id: string;
  productos: {
    nombre: string;
    unidad_inventario: string;
  };
  detalle_recetas: Array<{
    id: string;
    insumo_id: string;
    cantidad_insumo_por_unidad: number;
    insumo: {
      nombre: string;
      unidad_inventario: string;
      stock_actual: number;
    };
  }>;
};

type InsumoReceta = {
  insumo_id: string;
  cantidad: number;
};

const RecetasManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [insumos, setInsumos] = useState<InsumoReceta[]>([]);
  const [currentInsumoId, setCurrentInsumoId] = useState("");
  const [currentCantidad, setCurrentCantidad] = useState("");

  // Fetch productos preparados
  const { data: productosPreparados } = useQuery({
    queryKey: ["productos-preparados"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", user.id)
        .eq("tipo_producto", "preparado")
        .eq("es_activo", true)
        .order("nombre");

      if (error) throw error;
      return data as Producto[];
    },
  });

  // Fetch insumos (productos tipo retail)
  const { data: insumosDisponibles } = useQuery({
    queryKey: ["insumos-disponibles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", user.id)
        .eq("tipo_producto", "retail")
        .eq("es_activo", true)
        .order("nombre");

      if (error) throw error;
      return data as Producto[];
    },
  });

  // Fetch recetas existentes
  const { data: recetas, isLoading } = useQuery({
    queryKey: ["recetas"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("recetas")
        .select(`
          *,
          productos!recetas_producto_final_id_fkey (
            nombre,
            unidad_inventario
          ),
          detalle_recetas (
            id,
            insumo_id,
            cantidad_insumo_por_unidad,
            insumo:productos!detalle_recetas_insumo_id_fkey (
              nombre,
              unidad_inventario,
              stock_actual
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Receta[];
    },
  });

  // Create/Update receta mutation
  const saveRecetaMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      if (!selectedProducto) throw new Error("No producto selected");
      if (insumos.length === 0) throw new Error("Debes agregar al menos un insumo");

      // Check if receta already exists
      const { data: existingReceta } = await supabase
        .from("recetas")
        .select("id")
        .eq("producto_final_id", selectedProducto.id)
        .single();

      let recetaId: string;

      if (existingReceta) {
        // Update existing - delete old detalles and create new ones
        recetaId = existingReceta.id;
        
        // Delete old detalle_recetas
        const { error: deleteError } = await supabase
          .from("detalle_recetas")
          .delete()
          .eq("receta_id", recetaId);

        if (deleteError) throw deleteError;
      } else {
        // Create new receta
        const { data: newReceta, error: recetaError } = await supabase
          .from("recetas")
          .insert({
            producto_final_id: selectedProducto.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (recetaError) throw recetaError;
        recetaId = newReceta.id;
      }

      // Insert detalle_recetas
      const detalles = insumos.map((insumo) => ({
        receta_id: recetaId,
        insumo_id: insumo.insumo_id,
        cantidad_insumo_por_unidad: insumo.cantidad,
      }));

      const { error: detalleError } = await supabase
        .from("detalle_recetas")
        .insert(detalles);

      if (detalleError) throw detalleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recetas"] });
      toast.success("Receta guardada exitosamente");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Error al guardar receta: " + error.message);
    },
  });

  // Delete receta mutation
  const deleteRecetaMutation = useMutation({
    mutationFn: async (recetaId: string) => {
      // Delete detalle_recetas first (due to foreign key)
      const { error: detalleError } = await supabase
        .from("detalle_recetas")
        .delete()
        .eq("receta_id", recetaId);

      if (detalleError) throw detalleError;

      // Delete receta
      const { error } = await supabase
        .from("recetas")
        .delete()
        .eq("id", recetaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recetas"] });
      toast.success("Receta eliminada");
    },
    onError: (error) => {
      toast.error("Error al eliminar receta: " + error.message);
    },
  });

  const handleOpenDialog = (producto: Producto, receta?: Receta) => {
    setSelectedProducto(producto);
    setSelectedReceta(receta || null);
    
    if (receta) {
      // Load existing insumos
      const existingInsumos = receta.detalle_recetas.map((detalle) => ({
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad_insumo_por_unidad,
      }));
      setInsumos(existingInsumos);
    } else {
      setInsumos([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProducto(null);
    setSelectedReceta(null);
    setInsumos([]);
    setCurrentInsumoId("");
    setCurrentCantidad("");
  };

  const handleAddInsumo = () => {
    if (!currentInsumoId || !currentCantidad) {
      toast.error("Selecciona un insumo y especifica la cantidad");
      return;
    }

    const cantidad = parseFloat(currentCantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    // Check if insumo already exists
    if (insumos.some((i) => i.insumo_id === currentInsumoId)) {
      toast.error("Este insumo ya está agregado");
      return;
    }

    setInsumos([...insumos, { insumo_id: currentInsumoId, cantidad }]);
    setCurrentInsumoId("");
    setCurrentCantidad("");
    toast.success("Insumo agregado");
  };

  const handleRemoveInsumo = (insumoId: string) => {
    setInsumos(insumos.filter((i) => i.insumo_id !== insumoId));
    toast.info("Insumo removido");
  };

  const handleSubmit = () => {
    if (insumos.length === 0) {
      toast.error("Debes agregar al menos un insumo a la receta");
      return;
    }
    saveRecetaMutation.mutate();
  };

  const getInsumoNombre = (insumoId: string) => {
    return insumosDisponibles?.find((i) => i.id === insumoId)?.nombre || "";
  };

  const getInsumoUnidad = (insumoId: string) => {
    return insumosDisponibles?.find((i) => i.id === insumoId)?.unidad_inventario || "";
  };

  const getRecetaForProducto = (productoId: string) => {
    return recetas?.find((r) => r.producto_final_id === productoId);
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
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ChefHat className="h-8 w-8" />
                Gestión de Recetas
              </h1>
              <p className="text-muted-foreground">Define insumos para productos preparados</p>
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Las recetas definen qué insumos y en qué cantidades se necesitan para preparar cada producto. 
            Al completar una orden en el POS, los insumos se descuentan automáticamente del inventario.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Productos Preparados ({productosPreparados?.length || 0})</CardTitle>
            <CardDescription>
              Configura las recetas para tus productos preparados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Estado Receta</TableHead>
                    <TableHead>Insumos Configurados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  ) : productosPreparados && productosPreparados.length > 0 ? (
                    productosPreparados.map((producto) => {
                      const receta = getRecetaForProducto(producto.id);
                      return (
                        <TableRow key={producto.id}>
                          <TableCell className="font-medium">{producto.nombre}</TableCell>
                          <TableCell>{producto.unidad_inventario}</TableCell>
                          <TableCell>
                            <Badge variant={producto.stock_actual > 0 ? "default" : "destructive"}>
                              {producto.stock_actual} {producto.unidad_inventario}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {receta ? (
                              <Badge variant="default">Configurada</Badge>
                            ) : (
                              <Badge variant="secondary">Sin configurar</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {receta ? (
                              <span className="text-sm">
                                {receta.detalle_recetas.length} insumo(s)
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(producto, receta)}
                            >
                              {receta ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                            {receta && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteRecetaMutation.mutate(receta.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay productos preparados. Crea productos con tipo "Preparado" en Gestión de Productos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recetas configuradas */}
        {recetas && recetas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recetas Configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recetas.map((receta) => (
                  <Card key={receta.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {receta.productos.nombre}
                      </CardTitle>
                      <CardDescription>
                        Insumos necesarios por {receta.productos.unidad_inventario}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {receta.detalle_recetas.map((detalle) => (
                          <div
                            key={detalle.id}
                            className="flex justify-between items-center p-2 bg-secondary/20 rounded"
                          >
                            <span className="font-medium">{detalle.insumo.nombre}</span>
                            <div className="flex items-center gap-4">
                              <span>
                                {detalle.cantidad_insumo_por_unidad} {detalle.insumo.unidad_inventario}
                              </span>
                              <Badge variant={detalle.insumo.stock_actual > 0 ? "default" : "destructive"}>
                                Stock: {detalle.insumo.stock_actual}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog for creating/editing receta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReceta ? "Editar" : "Crear"} Receta - {selectedProducto?.nombre}
            </DialogTitle>
            <DialogDescription>
              Define los insumos necesarios para preparar 1 {selectedProducto?.unidad_inventario}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Add insumo form */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7 space-y-2">
                <Label>Insumo</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={currentInsumoId}
                  onChange={(e) => setCurrentInsumoId(e.target.value)}
                >
                  <option value="">Seleccionar insumo...</option>
                  {insumosDisponibles?.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nombre} (Stock: {insumo.stock_actual} {insumo.unidad_inventario})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentCantidad}
                  onChange={(e) => setCurrentCantidad(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button onClick={handleAddInsumo} className="w-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* List of added insumos */}
            {insumos.length > 0 && (
              <div className="space-y-2">
                <Label>Insumos agregados:</Label>
                <div className="border rounded p-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {insumos.map((insumo) => (
                    <div
                      key={insumo.insumo_id}
                      className="flex justify-between items-center p-2 bg-secondary rounded"
                    >
                      <span className="font-medium">
                        {getInsumoNombre(insumo.insumo_id)}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>
                          {insumo.cantidad} {getInsumoUnidad(insumo.insumo_id)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInsumo(insumo.insumo_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveRecetaMutation.isPending || insumos.length === 0}
            >
              {saveRecetaMutation.isPending ? "Guardando..." : "Guardar Receta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecetasManagement;
