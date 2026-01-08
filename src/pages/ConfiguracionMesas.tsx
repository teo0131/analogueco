import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, Trash2, Move, Save, Square, Circle, RectangleHorizontal,
  UtensilsCrossed, Bath, DoorOpen, Minus, LayoutGrid
} from "lucide-react";

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

interface ElementoPlanta {
  id: string;
  tipo: string;
  nombre: string | null;
  pos_x: number;
  pos_y: number;
  ancho: number;
  alto: number;
  forma: string;
  color: string;
  rotacion: number;
}

type PaletteItem = {
  tipo: string;
  label: string;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
  defaultColor: string;
  forma: string;
};

const paletteItems: PaletteItem[] = [
  { tipo: "mesa", label: "Mesa", icon: <Circle className="w-5 h-5" />, defaultWidth: 80, defaultHeight: 80, defaultColor: "hsl(var(--primary))", forma: "circular" },
  { tipo: "barra", label: "Barra", icon: <RectangleHorizontal className="w-5 h-5" />, defaultWidth: 200, defaultHeight: 50, defaultColor: "#92400e", forma: "rectangular" },
  { tipo: "pared", label: "Pared", icon: <Minus className="w-5 h-5" />, defaultWidth: 150, defaultHeight: 15, defaultColor: "#374151", forma: "rectangular" },
  { tipo: "cocina", label: "Cocina", icon: <UtensilsCrossed className="w-5 h-5" />, defaultWidth: 120, defaultHeight: 80, defaultColor: "#059669", forma: "rectangular" },
  { tipo: "bano", label: "Baño", icon: <Bath className="w-5 h-5" />, defaultWidth: 60, defaultHeight: 60, defaultColor: "#0284c7", forma: "cuadrada" },
  { tipo: "entrada", label: "Entrada", icon: <DoorOpen className="w-5 h-5" />, defaultWidth: 80, defaultHeight: 30, defaultColor: "#7c3aed", forma: "rectangular" },
];

const ConfiguracionMesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [elementos, setElementos] = useState<ElementoPlanta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [elementDialogOpen, setElementDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [editingElemento, setEditingElemento] = useState<ElementoPlanta | null>(null);
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: "mesa" | "elemento" } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingFromPalette, setDraggingFromPalette] = useState<PaletteItem | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    numero_mesa: 1,
    nombre: "",
    capacidad: 4,
    ancho: 80,
    alto: 80,
    forma: "circular"
  });

  const [elementFormData, setElementFormData] = useState({
    nombre: "",
    ancho: 100,
    alto: 50,
    color: "#6b7280",
    rotacion: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [mesasRes, elementosRes] = await Promise.all([
      supabase.from("mesas").select("*").eq("user_id", user.id).order("numero_mesa"),
      supabase.from("elementos_planta").select("*").eq("user_id", user.id)
    ]);

    if (mesasRes.error) toast.error("Error al cargar mesas");
    if (elementosRes.error) toast.error("Error al cargar elementos");

    setMesas(mesasRes.data || []);
    setElementos(elementosRes.data || []);
    setLoading(false);
  };

  const handleCreateMesa = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextX = 50 + (mesas.length % 4) * 120;
    const nextY = 50 + Math.floor(mesas.length / 4) * 120;

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
    setFormData({ numero_mesa: mesas.length + 2, nombre: "", capacidad: 4, ancho: 80, alto: 80, forma: "circular" });
    fetchData();
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
    fetchData();
  };

  const handleDeleteMesa = async (id: string) => {
    const { error } = await supabase.from("mesas").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar mesa");
      return;
    }
    toast.success("Mesa eliminada");
    setDialogOpen(false);
    setEditingMesa(null);
    fetchData();
  };

  const handleCreateElemento = async (paletteItem: PaletteItem, posX: number, posY: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("elementos_planta").insert({
      user_id: user.id,
      tipo: paletteItem.tipo,
      nombre: paletteItem.label,
      pos_x: posX,
      pos_y: posY,
      ancho: paletteItem.defaultWidth,
      alto: paletteItem.defaultHeight,
      forma: paletteItem.forma,
      color: paletteItem.defaultColor,
      rotacion: 0
    });

    if (error) {
      toast.error("Error al crear elemento");
      return;
    }

    toast.success(`${paletteItem.label} agregado`);
    fetchData();
  };

  const handleUpdateElemento = async () => {
    if (!editingElemento) return;

    const { error } = await supabase
      .from("elementos_planta")
      .update({
        nombre: elementFormData.nombre || null,
        ancho: elementFormData.ancho,
        alto: elementFormData.alto,
        color: elementFormData.color,
        rotacion: elementFormData.rotacion
      })
      .eq("id", editingElemento.id);

    if (error) {
      toast.error("Error al actualizar elemento");
      return;
    }

    toast.success("Elemento actualizado");
    setElementDialogOpen(false);
    setEditingElemento(null);
    fetchData();
  };

  const handleDeleteElemento = async (id: string) => {
    const { error } = await supabase.from("elementos_planta").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar elemento");
      return;
    }
    toast.success("Elemento eliminado");
    setElementDialogOpen(false);
    setEditingElemento(null);
    fetchData();
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: "mesa" | "elemento", posX: number, posY: number) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingItem({ id, type });
    setDragOffset({
      x: e.clientX - rect.left - posX,
      y: e.clientY - rect.top - posY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (draggingItem) {
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 50));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));

      if (draggingItem.type === "mesa") {
        setMesas(prev => prev.map(m => 
          m.id === draggingItem.id ? { ...m, pos_x: newX, pos_y: newY } : m
        ));
      } else {
        setElementos(prev => prev.map(el => 
          el.id === draggingItem.id ? { ...el, pos_x: newX, pos_y: newY } : el
        ));
      }
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (draggingFromPalette) {
      const posX = e.clientX - rect.left - draggingFromPalette.defaultWidth / 2;
      const posY = e.clientY - rect.top - draggingFromPalette.defaultHeight / 2;
      
      if (posX >= 0 && posY >= 0 && posX <= rect.width && posY <= rect.height) {
        if (draggingFromPalette.tipo === "mesa") {
          openCreateMesaDialog();
        } else {
          await handleCreateElemento(draggingFromPalette, Math.max(0, posX), Math.max(0, posY));
        }
      }
      setDraggingFromPalette(null);
      return;
    }

    if (draggingItem) {
      if (draggingItem.type === "mesa") {
        const mesa = mesas.find(m => m.id === draggingItem.id);
        if (mesa) {
          await supabase
            .from("mesas")
            .update({ pos_x: mesa.pos_x, pos_y: mesa.pos_y })
            .eq("id", mesa.id);
        }
      } else {
        const elemento = elementos.find(el => el.id === draggingItem.id);
        if (elemento) {
          await supabase
            .from("elementos_planta")
            .update({ pos_x: elemento.pos_x, pos_y: elemento.pos_y })
            .eq("id", elemento.id);
        }
      }
      setDraggingItem(null);
    }
  };

  const openEditMesaDialog = (mesa: Mesa) => {
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

  const openCreateMesaDialog = () => {
    setEditingMesa(null);
    setFormData({ numero_mesa: mesas.length + 1, nombre: "", capacidad: 4, ancho: 80, alto: 80, forma: "circular" });
    setDialogOpen(true);
  };

  const openEditElementoDialog = (elemento: ElementoPlanta) => {
    setEditingElemento(elemento);
    setElementFormData({
      nombre: elemento.nombre || "",
      ancho: elemento.ancho,
      alto: elemento.alto,
      color: elemento.color,
      rotacion: elemento.rotacion
    });
    setElementDialogOpen(true);
  };

  const getMesaShape = (forma: string) => {
    switch (forma) {
      case "circular": return "rounded-full";
      case "rectangular": return "rounded-md";
      default: return "rounded-lg";
    }
  };

  const handlePaletteDragStart = (item: PaletteItem) => {
    setDraggingFromPalette(item);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-6 h-6" />
            Diseñador de Planta
          </h1>
          <p className="text-muted-foreground">Arrastra elementos de la paleta al canvas para diseñar tu restaurante</p>
        </div>
        <Button onClick={openCreateMesaDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mesa
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Palette Sidebar */}
        <Card className="w-48 flex-shrink-0">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Paleta de Elementos</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {paletteItems.map((item) => (
              <div
                key={item.tipo}
                draggable
                onDragStart={() => handlePaletteDragStart(item)}
                onDragEnd={() => setDraggingFromPalette(null)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors"
              >
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: item.defaultColor }}
                >
                  {item.icon}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="flex-1">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Move className="w-4 h-4" />
              Planta del Restaurante
              <span className="text-muted-foreground font-normal ml-2">
                (Doble clic para editar)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div
              ref={canvasRef}
              className="relative w-full h-[600px] bg-muted/20 rounded-lg border-2 border-dashed border-border overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setDraggingItem(null);
                setDraggingFromPalette(null);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                if (draggingFromPalette && canvasRef.current) {
                  const rect = canvasRef.current.getBoundingClientRect();
                  const posX = e.clientX - rect.left - draggingFromPalette.defaultWidth / 2;
                  const posY = e.clientY - rect.top - draggingFromPalette.defaultHeight / 2;
                  
                  if (draggingFromPalette.tipo === "mesa") {
                    openCreateMesaDialog();
                  } else {
                    await handleCreateElemento(draggingFromPalette, Math.max(0, posX), Math.max(0, posY));
                  }
                  setDraggingFromPalette(null);
                }
              }}
            >
              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Render elementos first (behind mesas) */}
              {elementos.map((elemento) => {
                const paletteItem = paletteItems.find(p => p.tipo === elemento.tipo);
                return (
                  <div
                    key={elemento.id}
                    className={`absolute cursor-move flex items-center justify-center shadow-md transition-shadow hover:shadow-lg ${
                      elemento.forma === "circular" ? "rounded-full" : "rounded-md"
                    } ${draggingItem?.id === elemento.id ? "ring-2 ring-accent z-20" : "z-10"}`}
                    style={{
                      left: elemento.pos_x,
                      top: elemento.pos_y,
                      width: elemento.ancho,
                      height: elemento.alto,
                      backgroundColor: elemento.color,
                      transform: `rotate(${elemento.rotacion}deg)`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, elemento.id, "elemento", elemento.pos_x, elemento.pos_y)}
                    onDoubleClick={() => openEditElementoDialog(elemento)}
                  >
                    <div className="text-white/80">
                      {paletteItem?.icon}
                    </div>
                    {elemento.nombre && elemento.ancho > 60 && (
                      <span className="absolute bottom-1 text-[10px] text-white/70 font-medium">
                        {elemento.nombre}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Render mesas (on top) */}
              {mesas.map((mesa) => (
                <div
                  key={mesa.id}
                  className={`absolute cursor-move flex flex-col items-center justify-center bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl ${getMesaShape(mesa.forma)} ${
                    draggingItem?.id === mesa.id ? "ring-2 ring-accent z-30" : "z-20"
                  }`}
                  style={{
                    left: mesa.pos_x,
                    top: mesa.pos_y,
                    width: mesa.ancho,
                    height: mesa.alto
                  }}
                  onMouseDown={(e) => handleMouseDown(e, mesa.id, "mesa", mesa.pos_x, mesa.pos_y)}
                  onDoubleClick={() => openEditMesaDialog(mesa)}
                >
                  <span className="font-bold text-lg">#{mesa.numero_mesa}</span>
                  <span className="text-xs opacity-80">{mesa.capacidad}p</span>
                </div>
              ))}

              {mesas.length === 0 && elementos.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                  <div className="text-center">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Arrastra elementos de la paleta izquierda</p>
                    <p className="text-sm">o haz clic en "Nueva Mesa" para empezar</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Mesas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Mesas Configuradas ({mesas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {mesas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay mesas configuradas aún.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mesas.map((mesa) => (
                <div
                  key={mesa.id}
                  onClick={() => openEditMesaDialog(mesa)}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <p className="font-medium">Mesa #{mesa.numero_mesa}</p>
                  {mesa.nombre && <p className="text-xs text-muted-foreground truncate">{mesa.nombre}</p>}
                  <p className="text-xs text-muted-foreground">{mesa.capacidad} personas</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Mesa */}
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
                  <SelectItem value="circular">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" /> Circular
                    </div>
                  </SelectItem>
                  <SelectItem value="cuadrada">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" /> Cuadrada
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
          <DialogFooter className="flex justify-between">
            {editingMesa && (
              <Button variant="destructive" onClick={() => handleDeleteMesa(editingMesa.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={editingMesa ? handleUpdateMesa : handleCreateMesa}>
                <Save className="w-4 h-4 mr-2" />
                {editingMesa ? "Guardar" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Elemento */}
      <Dialog open={elementDialogOpen} onOpenChange={setElementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {editingElemento?.tipo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre/Etiqueta</Label>
              <Input
                value={elementFormData.nombre}
                onChange={(e) => setElementFormData({ ...elementFormData, nombre: e.target.value })}
                placeholder="Ej: Barra principal, Cocina, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ancho (px)</Label>
                <Input
                  type="number"
                  value={elementFormData.ancho}
                  onChange={(e) => setElementFormData({ ...elementFormData, ancho: parseInt(e.target.value) || 50 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (px)</Label>
                <Input
                  type="number"
                  value={elementFormData.alto}
                  onChange={(e) => setElementFormData({ ...elementFormData, alto: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={elementFormData.color}
                    onChange={(e) => setElementFormData({ ...elementFormData, color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={elementFormData.color}
                    onChange={(e) => setElementFormData({ ...elementFormData, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rotación (°)</Label>
                <Select 
                  value={elementFormData.rotacion.toString()} 
                  onValueChange={(v) => setElementFormData({ ...elementFormData, rotacion: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0°</SelectItem>
                    <SelectItem value="45">45°</SelectItem>
                    <SelectItem value="90">90°</SelectItem>
                    <SelectItem value="135">135°</SelectItem>
                    <SelectItem value="180">180°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingElemento && (
              <Button variant="destructive" onClick={() => handleDeleteElemento(editingElemento.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setElementDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateElemento}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracionMesas;