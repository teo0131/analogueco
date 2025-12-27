import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Plus, Edit, AlertTriangle, PackagePlus, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Producto {
  id: string;
  nombre: string;
  codigo_interno: string | null;
  codigo_barra: string | null;
  categoria: string | null;
  unidad_inventario: string;
  tipo_producto: "retail" | "preparado" | "insumo";
  stock_actual: number;
  stock_minimo: number;
  costo_promedio: number;
  es_activo: boolean;
}

const ProductosManagement = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Quick stock entry state
  const [quickStockOpen, setQuickStockOpen] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState<Producto | null>(null);
  const [quickStockQty, setQuickStockQty] = useState<number>(1);
  const [quickStockCost, setQuickStockCost] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    codigo_interno: "",
    codigo_barra: "",
    categoria: "",
    unidad_inventario: "unidad",
    tipo_producto: "retail" as "retail" | "preparado" | "insumo",
    stock_minimo: 0,
    es_activo: true,
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    const filtered = productos.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_barra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProductos(filtered);
  }, [searchTerm, productos]);

  const fetchProductos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre");

      if (error) throw error;
      setProductos(data || []);
      setFilteredProductos(data || []);
    } catch (error: any) {
      toast.error("Error al cargar productos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      codigo_interno: "",
      codigo_barra: "",
      categoria: "",
      unidad_inventario: "unidad",
      tipo_producto: "retail",
      stock_minimo: 0,
      es_activo: true,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Producto) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre,
        codigo_interno: product.codigo_interno || "",
        codigo_barra: product.codigo_barra || "",
        categoria: product.categoria || "",
        unidad_inventario: product.unidad_inventario,
        tipo_producto: product.tipo_producto,
        stock_minimo: product.stock_minimo,
        es_activo: product.es_activo,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (editingProduct) {
        const { error } = await supabase
          .from("productos")
          .update({
            nombre: formData.nombre.trim(),
            codigo_interno: formData.codigo_interno.trim() || null,
            codigo_barra: formData.codigo_barra.trim() || null,
            categoria: formData.categoria.trim() || null,
            unidad_inventario: formData.unidad_inventario,
            tipo_producto: formData.tipo_producto,
            stock_minimo: formData.stock_minimo,
            es_activo: formData.es_activo,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Producto actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("productos")
          .insert({
            nombre: formData.nombre.trim(),
            codigo_interno: formData.codigo_interno.trim() || null,
            codigo_barra: formData.codigo_barra.trim() || null,
            categoria: formData.categoria.trim() || null,
            unidad_inventario: formData.unidad_inventario,
            tipo_producto: formData.tipo_producto,
            stock_minimo: formData.stock_minimo,
            es_activo: formData.es_activo,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Producto creado exitosamente");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProductos();
    } catch (error: any) {
      toast.error("Error al guardar producto: " + error.message);
    }
  };

  const handleOpenQuickStock = (producto: Producto) => {
    setQuickStockProduct(producto);
    setQuickStockQty(1);
    setQuickStockCost(producto.costo_promedio || 0);
    setQuickStockOpen(true);
  };

  const handleQuickStockSave = async () => {
    if (!quickStockProduct) return;
    if (quickStockQty <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (quickStockCost <= 0) {
      toast.error("El costo unitario debe ser mayor a 0");
      return;
    }

    setSavingStock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Calculate new weighted average cost
      const stockAnterior = quickStockProduct.stock_actual;
      const costoAnterior = quickStockProduct.costo_promedio;
      const stockTotal = stockAnterior + quickStockQty;
      const costoPromedio = stockTotal > 0 
        ? ((stockAnterior * costoAnterior) + (quickStockQty * quickStockCost)) / stockTotal
        : quickStockCost;

      // Update product stock and cost
      const { error: updateError } = await supabase
        .from('productos')
        .update({
          stock_actual: stockTotal,
          costo_promedio: costoPromedio
        })
        .eq('id', quickStockProduct.id);

      if (updateError) throw updateError;

      // Create inventory movement
      const { error: movError } = await supabase
        .from('movimientos_inventario')
        .insert({
          user_id: user.id,
          producto_id: quickStockProduct.id,
          tipo_movimiento: 'entrada',
          referencia: 'Ingreso rápido desde productos',
          cantidad: quickStockQty,
          stock_resultante: stockTotal,
          costo_unitario_referencia: quickStockCost,
          notas: `Ingreso rápido - ${quickStockProduct.nombre}`
        });

      if (movError) throw movError;

      toast.success(`Stock actualizado: +${quickStockQty} ${quickStockProduct.unidad_inventario}`);
      setQuickStockOpen(false);
      setQuickStockProduct(null);
      fetchProductos();
    } catch (error: any) {
      toast.error("Error al actualizar stock: " + error.message);
    } finally {
      setSavingStock(false);
    }
  };

  const getStockBadge = (producto: Producto) => {
    if (producto.stock_actual <= 0) {
      return <Badge variant="destructive">Sin stock</Badge>;
    }
    if (producto.stock_actual <= producto.stock_minimo) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Stock bajo</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Stock OK</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Gestión de Productos e Inventario</h1>
              <p className="text-muted-foreground mt-2">Administra tu catálogo y stock de productos</p>
            </div>
          </div>
          <Button onClick={() => navigate("/ingreso-inventario")} variant="default" className="gap-2">
            <PackagePlus className="h-4 w-4" />
            Ingreso con Factura
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Nombre, código de barras, código interno o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoría</Label>
                      <Input
                        id="categoria"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="codigo_interno">Código Interno</Label>
                      <Input
                        id="codigo_interno"
                        value={formData.codigo_interno}
                        onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="codigo_barra">Código de Barras</Label>
                      <Input
                        id="codigo_barra"
                        value={formData.codigo_barra}
                        onChange={(e) => setFormData({ ...formData, codigo_barra: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo_producto">Tipo de Producto</Label>
                      <Select
                        value={formData.tipo_producto}
                        onValueChange={(value: "retail" | "preparado" | "insumo") =>
                          setFormData({ ...formData, tipo_producto: value })
                        }
                      >
                        <SelectTrigger id="tipo_producto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail (Compra-Venta)</SelectItem>
                          <SelectItem value="preparado">Preparado (Con Receta)</SelectItem>
                          <SelectItem value="insumo">Insumo (Ingrediente para recetas)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="unidad_inventario">Unidad de Inventario</Label>
                      <Input
                        id="unidad_inventario"
                        value={formData.unidad_inventario}
                        onChange={(e) => setFormData({ ...formData, unidad_inventario: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                      <Input
                        id="stock_minimo"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.stock_minimo}
                        onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="es_activo"
                        checked={formData.es_activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, es_activo: checked })}
                      />
                      <Label htmlFor="es_activo">Producto Activo</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProduct ? "Actualizar" : "Crear"} Producto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Códigos</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Costo Prom.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProductos.map((producto) => (
                  <TableRow key={producto.id} className={!producto.es_activo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {producto.stock_actual <= producto.stock_minimo && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        {producto.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {producto.codigo_barra && <div>CB: {producto.codigo_barra}</div>}
                        {producto.codigo_interno && <div>CI: {producto.codigo_interno}</div>}
                        {!producto.codigo_barra && !producto.codigo_interno && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {producto.tipo_producto === "retail" ? "Retail" : producto.tipo_producto === "preparado" ? "Preparado" : "Insumo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{producto.categoria || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold">
                          {producto.stock_actual} {producto.unidad_inventario}
                        </span>
                        {getStockBadge(producto)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${producto.costo_promedio.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {producto.es_activo ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(producto)}
                          title="Editar producto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(producto.tipo_producto === 'retail' || producto.tipo_producto === 'insumo') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenQuickStock(producto)}
                            title="Ingresar stock rápido"
                            className="gap-1"
                          >
                            <PackagePlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          Mostrando {filteredProductos.length} de {productos.length} productos
        </div>
      </div>

      {/* Quick Stock Entry Dialog */}
      <Dialog open={quickStockOpen} onOpenChange={setQuickStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" />
              Ingreso Rápido de Stock
            </DialogTitle>
            <DialogDescription>
              {quickStockProduct?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Stock actual</div>
              <div className="text-xl font-bold">
                {quickStockProduct?.stock_actual} {quickStockProduct?.unidad_inventario}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quickQty">Cantidad a ingresar</Label>
                <Input
                  id="quickQty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quickStockQty}
                  onChange={(e) => setQuickStockQty(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="quickCost">Costo unitario</Label>
                <Input
                  id="quickCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quickStockCost}
                  onChange={(e) => setQuickStockCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Nuevo stock</div>
              <div className="text-xl font-bold text-primary">
                {((quickStockProduct?.stock_actual || 0) + quickStockQty).toFixed(2)} {quickStockProduct?.unidad_inventario}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setQuickStockOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleQuickStockSave} disabled={savingStock}>
                {savingStock ? "Guardando..." : "Guardar Ingreso"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductosManagement;
