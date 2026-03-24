import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";

interface MenuItemDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  es_activo: boolean;
  orden_display: number | null;
  image_url: string | null;
  tipo_item: string;
}

const MenuManagement = () => {
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
    tipo_item: "retail",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastListScrollYRef = useRef(0);

  // PIN protection
  const [pinDialog, setPinDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const setDialogOpen = (open: boolean) => {
    if (open) {
      lastListScrollYRef.current = window.scrollY;
    }

    setIsDialogOpen(open);

    if (!open) {
      requestAnimationFrame(() => {
        window.scrollTo(0, lastListScrollYRef.current);
      });
    }
  };

  const fetchMenuItems = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    // Guardar scroll actual antes de abrir el modal
    lastListScrollYRef.current = window.scrollY;

    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion || "",
        precio: item.precio.toString(),
        categoria: item.categoria || "",
        es_activo: item.es_activo,
        orden_display: item.orden_display?.toString() || "0",
        tipo_item: item.tipo_item || "retail",
      });
      setImagePreview(item.image_url);
    } else {
      setEditingItem(null);
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        categoria: "",
        es_activo: true,
        orden_display: "0",
        tipo_item: "retail",
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = async () => {
    if (editingItem?.image_url) {
      // Extract filename from URL to delete from storage
      const url = editingItem.image_url;
      const fileName = url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("menu-images").remove([fileName]);
      }
      // Update DB to remove image_url
      await supabase
        .from("menu_items")
        .update({ image_url: null })
        .eq("id", editingItem.id);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File, itemId: string): Promise<string | null> => {
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    const fileName = `${itemId}-${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      let imageUrl = editingItem?.image_url || null;

      const itemData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: parseFloat(formData.precio),
        categoria: formData.categoria || null,
        es_activo: formData.es_activo,
        orden_display: parseInt(formData.orden_display) || 0,
        tipo_item: formData.tipo_item,
        user_id: user.id,
      };

      if (editingItem) {
        // If there's a new image selected, upload it
        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage, editingItem.id);
        }

        const { error } = await supabase
          .from("menu_items")
          .update({ ...itemData, image_url: imageUrl })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item actualizado");
      } else {
        // Create item first to get ID
        const { data: newItem, error } = await supabase
          .from("menu_items")
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;

        // If there's an image, upload it and update the item
        if (selectedImage && newItem) {
          imageUrl = await uploadImage(selectedImage, newItem.id);
          await supabase
            .from("menu_items")
            .update({ image_url: imageUrl })
            .eq("id", newItem.id);
        }

        toast.success("Item creado");
      }

      setDialogOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      await fetchMenuItems();
      requestAnimationFrame(() => window.scrollTo(0, lastListScrollYRef.current));
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Error al guardar");
    } finally {
      setUploadingImage(false);
    }
  };

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    setPinDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const item = menuItems.find(i => i.id === id);
      // Delete image from storage if exists
      if (item?.image_url) {
        const fileName = item.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("menu-images").remove([fileName]);
        }
      }

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

  const filteredItems = menuItems
    .filter(item =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  const categories = Array.from(new Set(menuItems.map(item => item.categoria).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PinVerificationDialog
        open={pinDialog}
        onOpenChange={setPinDialog}
        onSuccess={() => { if (pendingDeleteId) { handleDelete(pendingDeleteId); setPendingDeleteId(null); } }}
        title="Eliminar Item del Menú"
        description="Ingresa tu PIN para confirmar la eliminación de este item del menú."
      />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Menú</h1>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Nuevo Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Imagen (opcional)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center border">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Subir imagen
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

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
              <div className="space-y-2">
                <Label htmlFor="tipo_item">Tipo de Producto</Label>
                <select
                  id="tipo_item"
                  value={formData.tipo_item}
                  onChange={(e) => setFormData({ ...formData, tipo_item: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="retail">Retail (stock directo)</option>
                  <option value="receta">Receta (descuenta insumos)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Retail: el stock se reduce unitariamente al vender. Receta: los insumos se descuentan según la receta configurada.
                </p>
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
              <Button type="submit" className="w-full" disabled={uploadingImage}>
                {uploadingImage ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <TableHead className="w-16">Imagen</TableHead>
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
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.nombre} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>
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
                      <div className="flex justify-end gap-1">
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
                          onClick={() => requestDelete(item.id)}
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
  );
};

export default MenuManagement;
