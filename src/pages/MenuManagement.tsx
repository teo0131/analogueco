import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface MenuItemDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  es_activo: boolean;
  orden_display: number | null;
}

const MenuManagement = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDB | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    es_activo: true,
    orden_display: "0",
  });

  const fetchMenuItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("user_id", user.id)
        .order("categoria")
        .order("orden_display");

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error al cargar el menú");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleOpenDialog = (item?: MenuItemDB) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion || "",
        precio: item.precio.toString(),
        categoria: item.categoria || "",
        es_activo: item.es_activo,
        orden_display: item.orden_display?.toString() || "0",
      });
    } else {
      setEditingItem(null);
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        categoria: "",
        es_activo: true,
        orden_display: "0",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const itemData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: parseFloat(formData.precio),
        categoria: formData.categoria || null,
        es_activo: formData.es_activo,
        orden_display: parseInt(formData.orden_display) || 0,
        user_id: user.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item actualizado");
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert(itemData);

        if (error) throw error;
        toast.success("Item creado");
      }

      setIsDialogOpen(false);
      fetchMenuItems();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este item del menú?")) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Item eliminado");
      fetchMenuItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error al eliminar");
    }
  };

  const handleToggleActive = async (item: MenuItemDB) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ es_activo: !item.es_activo })
        .eq("id", item.id);

      if (error) throw error;
      fetchMenuItems();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast.error("Error al actualizar");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredItems = menuItems.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(menuItems.map(item => item.categoria).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Menú</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item" : "Nuevo Item"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      list="categorias"
                    />
                    <datalist id="categorias">
                      {categories.map(cat => (
                        <option key={cat} value={cat || ""} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orden">Orden de Display</Label>
                    <Input
                      id="orden"
                      type="number"
                      value={formData.orden_display}
                      onChange={(e) => setFormData({ ...formData, orden_display: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="es_activo"
                      checked={formData.es_activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, es_activo: checked })}
                    />
                    <Label htmlFor="es_activo">Activo</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingItem ? "Actualizar" : "Crear"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items del Menú ({menuItems.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {menuItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tienes items en tu menú.</p>
                <p className="text-sm mt-2">Crea tu primer item haciendo clic en "Nuevo Item"</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className={!item.es_activo ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          {item.descripcion && (
                            <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.categoria || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.precio)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.es_activo}
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenuManagement;
