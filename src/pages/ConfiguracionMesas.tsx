import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Move, Save, Square, Circle, RectangleHorizontal } from "lucide-react";

interface Mesa {
  id: string;
  numero_mesa: number;
  nombre: string | null;
  capacidad: number;
  pos_x: number;
  pos_y: number;
  ancho: number;
  alto: number;
  forma: string;
  es_activa: boolean;
}

const ConfiguracionMesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [draggingMesa, setDraggingMesa] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    numero_mesa: 1,
    nombre: "",
    capacidad: 4,
    ancho: 80,
    alto: 80,
    forma: "cuadrada"
  });

  useEffect(() => {
    fetchMesas();
  }, []);

  const fetchMesas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("mesas")
      .select("*")
      .eq("user_id", user.id)
      .order("numero_mesa");

    if (error) {
      toast.error("Error al cargar mesas");
      return;
    }

    setMesas(data || []);
    setLoading(false);
  };

  const handleCreateMesa = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextX = (mesas.length % 5) * 100 + 20;
    const nextY = Math.floor(mesas.length / 5) * 100 + 20;

    const { error } = await supabase.from("mesas").insert({
      user_id: user.id,
      numero_mesa: formData.numero_mesa,
      nombre: formData.nombre || null,
      capacidad: formData.capacidad,
      ancho: formData.ancho,
      alto: formData.alto,
      forma: formData.forma,
      pos_x: nextX,
      pos_y: nextY
    });

    if (error) {
      toast.error("Error al crear mesa");
      return;
    }

    toast.success("Mesa creada");
    setDialogOpen(false);
    setFormData({ numero_mesa: mesas.length + 2, nombre: "", capacidad: 4, ancho: 80, alto: 80, forma: "cuadrada" });
    fetchMesas();
  };

  const handleUpdateMesa = async () => {
    if (!editingMesa) return;

    const { error } = await supabase
      .from("mesas")
      .update({
        numero_mesa: formData.numero_mesa,
        nombre: formData.nombre || null,
        capacidad: formData.capacidad,
        ancho: formData.ancho,
        alto: formData.alto,
        forma: formData.forma
      })
      .eq("id", editingMesa.id);

    if (error) {
      toast.error("Error al actualizar mesa");
      return;
    }

    toast.success("Mesa actualizada");
    setDialogOpen(false);
    setEditingMesa(null);
    fetchMesas();
  };

  const handleDeleteMesa = async (id: string) => {
    const { error } = await supabase.from("mesas").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar mesa");
      return;
    }
    toast.success("Mesa eliminada");
    fetchMesas();
  };

  const handleMouseDown = (e: React.MouseEvent, mesa: Mesa) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingMesa(mesa.id);
    setDragOffset({
      x: e.clientX - rect.left - mesa.pos_x,
      y: e.clientY - rect.top - mesa.pos_y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingMesa || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 80));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 80));

    setMesas(prev => prev.map(m => 
      m.id === draggingMesa ? { ...m, pos_x: newX, pos_y: newY } : m
    ));
  };

  const handleMouseUp = async () => {
    if (!draggingMesa) return;

    const mesa = mesas.find(m => m.id === draggingMesa);
    if (mesa) {
      await supabase
        .from("mesas")
        .update({ pos_x: mesa.pos_x, pos_y: mesa.pos_y })
        .eq("id", mesa.id);
    }

    setDraggingMesa(null);
  };

  const openEditDialog = (mesa: Mesa) => {
    setEditingMesa(mesa);
    setFormData({
      numero_mesa: mesa.numero_mesa,
      nombre: mesa.nombre || "",
      capacidad: mesa.capacidad,
      ancho: mesa.ancho,
      alto: mesa.alto,
      forma: mesa.forma
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingMesa(null);
    setFormData({ numero_mesa: mesas.length + 1, nombre: "", capacidad: 4, ancho: 80, alto: 80, forma: "cuadrada" });
    setDialogOpen(true);
  };

  const getMesaShape = (forma: string) => {
    switch (forma) {
      case "circular": return "rounded-full";
      case "rectangular": return "rounded-md";
      default: return "rounded-md";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Mesas</h1>
          <p className="text-muted-foreground">Arrastra las mesas para organizar la planta del restaurante</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mesa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Planta del Restaurante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={canvasRef}
            className="relative w-full h-[500px] bg-muted/30 rounded-lg border-2 border-dashed border-border overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`absolute cursor-move flex flex-col items-center justify-center bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl ${getMesaShape(mesa.forma)} ${draggingMesa === mesa.id ? "ring-2 ring-accent z-10" : ""}`}
                style={{
                  left: mesa.pos_x,
                  top: mesa.pos_y,
                  width: mesa.ancho,
                  height: mesa.alto
                }}
                onMouseDown={(e) => handleMouseDown(e, mesa)}
                onDoubleClick={() => openEditDialog(mesa)}
              >
                <span className="font-bold text-lg">#{mesa.numero_mesa}</span>
                <span className="text-xs opacity-80">{mesa.capacidad}p</span>
              </div>
            ))}

            {mesas.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No hay mesas configuradas. Haz clic en "Nueva Mesa" para empezar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Mesas ({mesas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                className="p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">Mesa #{mesa.numero_mesa}</p>
                  {mesa.nombre && <p className="text-sm text-muted-foreground">{mesa.nombre}</p>}
                  <p className="text-sm text-muted-foreground">Capacidad: {mesa.capacidad} personas</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(mesa)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteMesa(mesa.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMesa ? "Editar Mesa" : "Nueva Mesa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Mesa</Label>
                <Input
                  type="number"
                  value={formData.numero_mesa}
                  onChange={(e) => setFormData({ ...formData, numero_mesa: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre/Descripción (opcional)</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Terraza, VIP, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Forma</Label>
              <Select value={formData.forma} onValueChange={(v) => setFormData({ ...formData, forma: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cuadrada">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" /> Cuadrada
                    </div>
                  </SelectItem>
                  <SelectItem value="circular">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" /> Circular
                    </div>
                  </SelectItem>
                  <SelectItem value="rectangular">
                    <div className="flex items-center gap-2">
                      <RectangleHorizontal className="w-4 h-4" /> Rectangular
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ancho (px)</Label>
                <Input
                  type="number"
                  value={formData.ancho}
                  onChange={(e) => setFormData({ ...formData, ancho: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (px)</Label>
                <Input
                  type="number"
                  value={formData.alto}
                  onChange={(e) => setFormData({ ...formData, alto: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={editingMesa ? handleUpdateMesa : handleCreateMesa}>
              <Save className="w-4 h-4 mr-2" />
              {editingMesa ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracionMesas;
