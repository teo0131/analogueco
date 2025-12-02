import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Plus, Pencil, History, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Proveedor = {
  id: string;
  nombre: string;
  documento: string | null;
  contacto: string | null;
  observaciones: string | null;
  created_at: string;
};

type ProveedorFormData = {
  nombre: string;
  documento: string;
  contacto: string;
  observaciones: string;
};

const ProveedoresManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: "",
    documento: "",
    contacto: "",
    observaciones: "",
  });

  // Fetch proveedores
  const { data: proveedores, isLoading } = useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre");

      if (error) throw error;
      return data as Proveedor[];
    },
  });

  // Fetch compras count por proveedor
  const { data: comprasCounts } = useQuery({
    queryKey: ["proveedores-compras-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("entradas_inventario")
        .select("proveedor_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((entrada) => {
        counts[entrada.proveedor_id] = (counts[entrada.proveedor_id] || 0) + 1;
      });

      return counts;
    },
  });

  // Fetch historial de compras del proveedor seleccionado
  const { data: historialCompras } = useQuery({
    queryKey: ["proveedor-historial", selectedProveedor?.id],
    queryFn: async () => {
      if (!selectedProveedor) return [];

      const { data, error } = await supabase
        .from("entradas_inventario")
        .select(`
          *,
          detalle_entradas (
            cantidad,
            costo_unitario,
            costo_total,
            productos (
              nombre,
              unidad_inventario
            )
          )
        `)
        .eq("proveedor_id", selectedProveedor.id)
        .order("fecha_compra", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedProveedor && isHistoryOpen,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProveedorFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (selectedProveedor) {
        // Update
        const { error } = await supabase
          .from("proveedores")
          .update({
            nombre: data.nombre,
            documento: data.documento || null,
            contacto: data.contacto || null,
            observaciones: data.observaciones || null,
          })
          .eq("id", selectedProveedor.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("proveedores")
          .insert({
            nombre: data.nombre,
            documento: data.documento || null,
            contacto: data.contacto || null,
            observaciones: data.observaciones || null,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      toast.success(selectedProveedor ? "Proveedor actualizado" : "Proveedor creado");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Error al guardar proveedor: " + error.message);
    },
  });

  const handleOpenDialog = (proveedor?: Proveedor) => {
    if (proveedor) {
      setSelectedProveedor(proveedor);
      setFormData({
        nombre: proveedor.nombre,
        documento: proveedor.documento || "",
        contacto: proveedor.contacto || "",
        observaciones: proveedor.observaciones || "",
      });
    } else {
      setSelectedProveedor(null);
      setFormData({
        nombre: "",
        documento: "",
        contacto: "",
        observaciones: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProveedor(null);
    setFormData({
      nombre: "",
      documento: "",
      contacto: "",
      observaciones: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleViewHistory = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsHistoryOpen(true);
  };

  const filteredProveedores = proveedores?.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.documento && p.documento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                <Building2 className="h-8 w-8" />
                Gestión de Proveedores
              </h1>
              <p className="text-muted-foreground">Administra tus proveedores y consulta su historial</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Proveedores ({filteredProveedores?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando proveedores...
                      </TableCell>
                    </TableRow>
                  ) : filteredProveedores && filteredProveedores.length > 0 ? (
                    filteredProveedores.map((proveedor) => (
                      <TableRow key={proveedor.id}>
                        <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                        <TableCell>{proveedor.documento || "-"}</TableCell>
                        <TableCell>{proveedor.contacto || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {comprasCounts?.[proveedor.id] || 0} compras
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(proveedor.created_at), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(proveedor)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(proveedor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron proveedores
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {selectedProveedor
                ? "Actualiza la información del proveedor"
                : "Completa los datos del nuevo proveedor"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Documento (NIT/CC)</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) =>
                    setFormData({ ...formData, documento: e.target.value })
                  }
                  placeholder="123456789-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Contacto</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                  placeholder="Teléfono, email, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              Historial de Compras - {selectedProveedor?.nombre}
            </SheetTitle>
            <SheetDescription>
              Todas las compras realizadas a este proveedor
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            {historialCompras && historialCompras.length > 0 ? (
              <div className="space-y-4">
                {historialCompras.map((entrada) => (
                  <Card key={entrada.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            Factura: {entrada.numero_factura_proveedor || "Sin número"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entrada.fecha_compra), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                        {entrada.valor_total_factura && (
                          <Badge variant="outline" className="text-lg">
                            ${Number(entrada.valor_total_factura).toLocaleString("es-CO")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Productos:</p>
                        <div className="space-y-1">
                          {entrada.detalle_entradas?.map((detalle: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-sm flex justify-between items-center p-2 bg-secondary/20 rounded"
                            >
                              <span>
                                {detalle.productos?.nombre} - {detalle.cantidad}{" "}
                                {detalle.productos?.unidad_inventario}
                              </span>
                              <span className="font-medium">
                                ${Number(detalle.costo_total).toLocaleString("es-CO")}
                              </span>
                            </div>
                          ))}
                        </div>
                        {entrada.notas && (
                          <div className="mt-2 p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground">Notas:</p>
                            <p className="text-sm">{entrada.notas}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No hay compras registradas para este proveedor
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProveedoresManagement;
