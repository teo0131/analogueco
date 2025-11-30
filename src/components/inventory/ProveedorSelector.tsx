import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Proveedor {
  id: string;
  nombre: string;
  documento?: string;
}

interface ProveedorSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProveedorSelector = ({ value, onChange }: ProveedorSelectorProps) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: "",
    documento: "",
    contacto: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, documento')
        .order('nombre');

      if (error) throw error;
      setProveedores(data || []);
    } catch (error: any) {
      console.error("Error al cargar proveedores:", error);
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProveedor = async () => {
    if (!nuevoProveedor.nombre.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from('proveedores')
        .insert({
          user_id: user.id,
          nombre: nuevoProveedor.nombre.trim(),
          documento: nuevoProveedor.documento.trim() || null,
          contacto: nuevoProveedor.contacto.trim() || null,
          observaciones: nuevoProveedor.observaciones.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Proveedor creado exitosamente");
      setProveedores([...proveedores, data]);
      onChange(data.id);
      setShowDialog(false);
      setNuevoProveedor({ nombre: "", documento: "", contacto: "", observaciones: "" });
    } catch (error: any) {
      console.error("Error al crear proveedor:", error);
      toast.error(error.message || "Error al crear proveedor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange} disabled={loading}>
          <SelectTrigger className="flex-1 bg-background">
            <SelectValue placeholder={loading ? "Cargando..." : "Selecciona un proveedor"} />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {proveedores.map((prov) => (
              <SelectItem key={prov.id} value={prov.id}>
                {prov.nombre}
                {prov.documento && ` (${prov.documento})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowDialog(true)}
          title="Crear nuevo proveedor"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription>
              Crea un nuevo proveedor para agregar a la lista
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Nombre del proveedor"
                value={nuevoProveedor.nombre}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento (NIT/CC)</Label>
              <Input
                id="documento"
                placeholder="Número de documento"
                value={nuevoProveedor.documento}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, documento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto">Contacto</Label>
              <Input
                id="contacto"
                placeholder="Teléfono o email"
                value={nuevoProveedor.contacto}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                placeholder="Notas adicionales"
                value={nuevoProveedor.observaciones}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, observaciones: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProveedor} disabled={saving}>
              {saving ? "Creando..." : "Crear Proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
