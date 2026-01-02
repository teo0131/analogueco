import { useState } from "react";
import { useDialogScrollPreserve } from "@/hooks/useDialogScrollPreserve";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, ChefHat, AlertCircle, Coffee, Package, Lock } from "lucide-react";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MenuItem = {
  id: string;
  nombre: string;
  categoria: string | null;
  precio: number;
};

type Insumo = {
  id: string;
  nombre: string;
  unidad_inventario: string;
  stock_actual: number;
  costo_promedio: number;
};

type Receta = {
  id: string;
  menu_item_id: string | null;
  menu_items?: {
    nombre: string;
    categoria: string | null;
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
  const { isOpen: isDialogOpen, setDialogOpen, restoreScroll } = useDialogScrollPreserve();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [insumos, setInsumos] = useState<InsumoReceta[]>([]);
  const [currentInsumoId, setCurrentInsumoId] = useState("");
  const [currentCantidad, setCurrentCantidad] = useState("");
  
  // PIN verification state
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ menuItem: MenuItem; receta: Receta } | null>(null);

  // Fetch menu items (only recipe type, exclude retail/direct stock)
  const { data: menuItems } = useQuery({
    queryKey: ["menu-items-for-recipes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("menu_items")
        .select("id, nombre, categoria, precio")
        .eq("user_id", user.id)
        .eq("es_activo", true)
        .eq("tipo_item", "receta")
        .order("categoria")
        .order("nombre");

      if (error) throw error;
      return data as MenuItem[];
    },
  });

  // Fetch insumos (productos tipo 'insumo')
  const { data: insumosDisponibles } = useQuery({
    queryKey: ["insumos-disponibles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, unidad_inventario, stock_actual, costo_promedio")
        .eq("user_id", user.id)
        .eq("tipo_producto", "insumo")
        .eq("es_activo", true)
        .order("nombre");

      if (error) throw error;
      return data as Insumo[];
    },
  });

  // Fetch recetas existentes
  const { data: recetas, isLoading } = useQuery({
    queryKey: ["recetas-menu"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("recetas")
        .select(`
          id,
          menu_item_id,
          menu_items (
            nombre,
            categoria
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
        .not("menu_item_id", "is", null)
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
      if (!selectedMenuItem) throw new Error("No menu item selected");
      if (insumos.length === 0) throw new Error("Debes agregar al menos un insumo");

      // Check if receta already exists for this menu item
      const { data: existingReceta } = await supabase
        .from("recetas")
        .select("id")
        .eq("menu_item_id", selectedMenuItem.id)
        .maybeSingle();

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
            menu_item_id: selectedMenuItem.id,
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
      queryClient.invalidateQueries({ queryKey: ["recetas-menu"] });
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
      queryClient.invalidateQueries({ queryKey: ["recetas-menu"] });
      toast.success("Receta eliminada");
    },
    onError: (error) => {
      toast.error("Error al eliminar receta: " + error.message);
    },
  });

  const handleOpenDialog = (menuItem: MenuItem, receta?: Receta) => {
    // If editing an existing recipe, require PIN verification
    if (receta) {
      setPendingEdit({ menuItem, receta });
      setShowPinDialog(true);
      return;
    }
    
    // Creating new recipe - no PIN needed
    openRecipeDialog(menuItem, undefined);
  };

  const handlePinSuccess = () => {
    if (pendingEdit) {
      openRecipeDialog(pendingEdit.menuItem, pendingEdit.receta);
      setPendingEdit(null);
    }
  };

  const openRecipeDialog = (menuItem: MenuItem, receta?: Receta) => {
    setSelectedMenuItem(menuItem);
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
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMenuItem(null);
    setSelectedReceta(null);
    setInsumos([]);
    setCurrentInsumoId("");
    setCurrentCantidad("");
    restoreScroll();
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

  const handleUpdateInsumoCantidad = (insumoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) return;
    setInsumos(insumos.map((i) => 
      i.insumo_id === insumoId ? { ...i, cantidad: nuevaCantidad } : i
    ));
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

  const getRecetaForMenuItem = (menuItemId: string) => {
    return recetas?.find((r) => r.menu_item_id === menuItemId);
  };

  // Group menu items by category
  const groupedMenuItems = menuItems?.reduce((acc, item) => {
    const category = item.categoria || "Sin Categoría";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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
              <p className="text-muted-foreground">Define los insumos para cada item del menú</p>
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Las recetas definen qué insumos (café, leche, azúcar, etc.) y en qué cantidades se necesitan para preparar cada item del menú. 
            Al completar una venta en el POS, los insumos se descuentan automáticamente del inventario.
          </AlertDescription>
        </Alert>

        {!insumosDisponibles || insumosDisponibles.length === 0 ? (
          <Alert variant="destructive">
            <Coffee className="h-4 w-4" />
            <AlertDescription>
              <strong>No hay insumos registrados.</strong> Primero debes crear insumos desde{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/inventario/ingreso")}>
                Ingreso de Inventario
              </Button>{" "}
              (tab Insumos) para poder configurar recetas.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="menu-items" className="space-y-4">
            <TabsList>
              <TabsTrigger value="menu-items" className="gap-2">
                <Package className="h-4 w-4" />
                Items del Menú
              </TabsTrigger>
              <TabsTrigger value="recetas-config" className="gap-2">
                <ChefHat className="h-4 w-4" />
                Recetas Configuradas ({recetas?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu-items">
              <Card>
                <CardHeader>
                  <CardTitle>Items del Menú ({menuItems?.length || 0})</CardTitle>
                  <CardDescription>
                    Configura las recetas para cada item de tu menú
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {groupedMenuItems && Object.entries(groupedMenuItems).map(([category, items]) => (
                      <div key={category} className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-primary">{category}</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Estado Receta</TableHead>
                              <TableHead>Insumos</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((menuItem) => {
                              const receta = getRecetaForMenuItem(menuItem.id);
                              return (
                                <TableRow key={menuItem.id}>
                                  <TableCell className="font-medium">{menuItem.nombre}</TableCell>
                                  <TableCell>${menuItem.precio.toLocaleString('es-CO')}</TableCell>
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
                                      onClick={() => handleOpenDialog(menuItem, receta)}
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
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                    {!menuItems || menuItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay items en el menú. Crea items en Gestión de Menú.
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recetas-config">
              {recetas && recetas.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {recetas.map((receta) => (
                    <Card key={receta.id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ChefHat className="h-5 w-5" />
                          {receta.menu_items?.nombre}
                        </CardTitle>
                        <CardDescription>
                          {receta.menu_items?.categoria || "Sin categoría"}
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay recetas configuradas aún.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* PIN Verification Dialog */}
      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={(open) => {
          setShowPinDialog(open);
          if (!open) setPendingEdit(null);
        }}
        onSuccess={handlePinSuccess}
        title="Editar Receta"
        description="Ingresa tu PIN de 4 dígitos para editar esta receta"
      />

      {/* Dialog for creating/editing receta */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReceta ? "Editar" : "Crear"} Receta - {selectedMenuItem?.nombre}
            </DialogTitle>
            <DialogDescription>
              Define los insumos necesarios para preparar 1 unidad de este item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Add insumo form */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7 space-y-2">
                <Label>Insumo</Label>
                <select
                  className="w-full p-2 border rounded bg-background"
                  value={currentInsumoId}
                  onChange={(e) => setCurrentInsumoId(e.target.value)}
                >
                  <option value="">Seleccionar insumo...</option>
                  {insumosDisponibles?.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nombre} ({insumo.unidad_inventario}) - Stock: {insumo.stock_actual}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.00"
                  value={currentCantidad}
                  onChange={(e) => setCurrentCantidad(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button onClick={handleAddInsumo} className="w-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Current insumos list */}
            {insumos.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                <Label className="text-sm font-medium">Insumos en la receta:</Label>
                {insumos.map((insumo) => (
                  <div
                    key={insumo.insumo_id}
                    className="flex justify-between items-center p-2 bg-secondary/30 rounded gap-2"
                  >
                    <span className="flex-1">{getInsumoNombre(insumo.insumo_id)}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={insumo.cantidad}
                        onChange={(e) => handleUpdateInsumoCantidad(insumo.insumo_id, parseFloat(e.target.value) || 0)}
                        className="w-24 text-right"
                      />
                      <span className="text-sm text-muted-foreground min-w-[40px]">
                        {getInsumoUnidad(insumo.insumo_id)}
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
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={insumos.length === 0 || saveRecetaMutation.isPending}
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
