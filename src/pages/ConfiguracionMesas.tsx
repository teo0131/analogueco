import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, Trash2, Move, Save, Square, Circle, RectangleHorizontal,
  UtensilsCrossed, Bath, DoorOpen, Minus, LayoutGrid, RotateCw, 
  Maximize2, Users, Clock, DollarSign, Check, X, MessageSquare, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface DetalleOrden {
  id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas: string | null;
  menu_item_id: string | null;
}

interface OrdenActiva {
  id: string;
  numero_orden: number;
  nombre_cliente: string | null;
  total: number;
  estado: string;
  created_at: string;
  mesa_id: string | null;
  detalles: DetalleOrden[];
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
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [elementDialogOpen, setElementDialogOpen] = useState(false);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [editingElemento, setEditingElemento] = useState<ElementoPlanta | null>(null);
  const [selectedMesaOrder, setSelectedMesaOrder] = useState<{ mesa: Mesa; orden: OrdenActiva | null } | null>(null);
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: "mesa" | "elemento" } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingFromPalette, setDraggingFromPalette] = useState<PaletteItem | null>(null);
  const [resizingItem, setResizingItem] = useState<{ id: string; type: "mesa" | "elemento"; corner: string } | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ id: string; type: "mesa" | "elemento" } | null>(null);
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

  const [orderComment, setOrderComment] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [mesasRes, elementosRes, ordenesRes] = await Promise.all([
      supabase.from("mesas").select("*").eq("user_id", user.id).order("numero_mesa"),
      supabase.from("elementos_planta").select("*").eq("user_id", user.id),
      supabase.from("ordenes_activas").select("*").eq("user_id", user.id).eq("estado", "abierta")
    ]);

    if (mesasRes.error) toast.error("Error al cargar mesas");
    if (elementosRes.error) toast.error("Error al cargar elementos");

    const ordenesConDetalles = await Promise.all(
      (ordenesRes.data || []).map(async (orden) => {
        const { data: detalles } = await supabase
          .from("detalle_ordenes_activas")
          .select("*")
          .eq("orden_id", orden.id);
        return { ...orden, detalles: detalles || [] };
      })
    );

    setMesas(mesasRes.data || []);
    setElementos(elementosRes.data || []);
    setOrdenesActivas(ordenesConDetalles);
    setLoading(false);
  };

  const getMesaOrden = useCallback((mesaId: string): OrdenActiva | null => {
    return ordenesActivas.find(o => o.mesa_id === mesaId) || null;
  }, [ordenesActivas]);

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

  // Handle rotation for selected element
  const handleRotate = async (degrees: number) => {
    if (!selectedElement) return;
    
    if (selectedElement.type === "elemento") {
      const elemento = elementos.find(e => e.id === selectedElement.id);
      if (elemento) {
        const newRotation = (elemento.rotacion + degrees) % 360;
        await supabase.from("elementos_planta").update({ rotacion: newRotation }).eq("id", selectedElement.id);
        setElementos(prev => prev.map(e => e.id === selectedElement.id ? { ...e, rotacion: newRotation } : e));
      }
    }
  };

  // Handle resize via slider for selected element
  const handleResize = async (scale: number) => {
    if (!selectedElement) return;

    if (selectedElement.type === "mesa") {
      const mesa = mesas.find(m => m.id === selectedElement.id);
      if (mesa) {
        const newAncho = Math.max(40, Math.round(80 * scale));
        const newAlto = Math.max(40, Math.round(80 * scale));
        await supabase.from("mesas").update({ ancho: newAncho, alto: newAlto }).eq("id", selectedElement.id);
        setMesas(prev => prev.map(m => m.id === selectedElement.id ? { ...m, ancho: newAncho, alto: newAlto } : m));
      }
    } else {
      const elemento = elementos.find(e => e.id === selectedElement.id);
      if (elemento) {
        const paletteItem = paletteItems.find(p => p.tipo === elemento.tipo);
        const baseWidth = paletteItem?.defaultWidth || 100;
        const baseHeight = paletteItem?.defaultHeight || 50;
        const newAncho = Math.max(30, Math.round(baseWidth * scale));
        const newAlto = Math.max(15, Math.round(baseHeight * scale));
        await supabase.from("elementos_planta").update({ ancho: newAncho, alto: newAlto }).eq("id", selectedElement.id);
        setElementos(prev => prev.map(e => e.id === selectedElement.id ? { ...e, ancho: newAncho, alto: newAlto } : e));
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: "mesa" | "elemento", posX: number, posY: number) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingItem({ id, type });
    setDragOffset({
      x: e.clientX - rect.left - posX,
      y: e.clientY - rect.top - posY
    });
    setSelectedElement({ id, type });
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

  const handleMesaClick = (mesa: Mesa, e: React.MouseEvent) => {
    e.stopPropagation();
    const orden = getMesaOrden(mesa.id);
    setSelectedMesaOrder({ mesa, orden });
    setOrderComment(orden?.nombre_cliente || "");
    setOrderSheetOpen(true);
  };

  const handleCloseOrder = async () => {
    if (!selectedMesaOrder?.orden) return;

    const orden = selectedMesaOrder.orden;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get the last order number for ordenes_pos
    const { data: lastOrder } = await supabase
      .from("ordenes_pos")
      .select("numero_orden")
      .eq("user_id", user.id)
      .order("numero_orden", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastOrder?.numero_orden || 0) + 1;

    // Create order in ordenes_pos
    const { data: newOrden, error: ordenError } = await supabase.from("ordenes_pos").insert({
      user_id: user.id,
      numero_orden: nextNumber,
      total: orden.total,
      comentario: orderComment || null,
      fecha: new Date().toISOString().split('T')[0]
    }).select().single();

    if (ordenError) {
      toast.error("Error al cerrar orden");
      return;
    }

    // Move details to ordenes_pos
    for (const detalle of orden.detalles) {
      await supabase.from("detalle_ordenes_pos").insert({
        orden_id: newOrden.id,
        menu_item_id: detalle.menu_item_id,
        nombre_item: detalle.nombre_item,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal
      });
    }

    // Delete the active order
    await supabase.from("ordenes_activas").delete().eq("id", orden.id);

    toast.success(`Orden #${orden.numero_orden} cerrada exitosamente`);
    setOrderSheetOpen(false);
    setSelectedMesaOrder(null);
    fetchData();
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
  };

  const getSelectedScale = (): number => {
    if (!selectedElement) return 1;
    
    if (selectedElement.type === "mesa") {
      const mesa = mesas.find(m => m.id === selectedElement.id);
      return mesa ? mesa.ancho / 80 : 1;
    } else {
      const elemento = elementos.find(e => e.id === selectedElement.id);
      if (elemento) {
        const paletteItem = paletteItems.find(p => p.tipo === elemento.tipo);
        return paletteItem ? elemento.ancho / paletteItem.defaultWidth : 1;
      }
    }
    return 1;
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
          <p className="text-muted-foreground">Arrastra elementos al canvas • Clic en mesa para ver orden • Verde = libre, Rojo = ocupada</p>
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
            <CardTitle className="text-sm font-medium">Paleta</CardTitle>
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

          {/* Element Controls */}
          {selectedElement && (
            <div className="p-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">CONTROLES</p>
              
              {selectedElement.type === "elemento" && (
                <div className="mb-3">
                  <Label className="text-xs">Rotar</Label>
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => handleRotate(-45)}>
                      <RotateCw className="w-3 h-3 rotate-180" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => handleRotate(45)}>
                      <RotateCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" /> Tamaño
                </Label>
                <Slider
                  value={[getSelectedScale()]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-2"
                  onValueChange={(v) => handleResize(v[0])}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>50%</span>
                  <span>200%</span>
                </div>
              </div>

              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full mt-2 text-xs"
                onClick={() => setSelectedElement(null)}
              >
                Deseleccionar
              </Button>
            </div>
          )}
        </Card>

        {/* Canvas */}
        <Card className="flex-1">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Move className="w-4 h-4" />
              Planta del Restaurante
              <span className="text-muted-foreground font-normal ml-2">
                (Clic en mesa para ver orden)
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
              onClick={() => setSelectedElement(null)}
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
                const isSelected = selectedElement?.id === elemento.id && selectedElement?.type === "elemento";
                return (
                  <div
                    key={elemento.id}
                    className="absolute"
                    style={{
                      left: elemento.pos_x,
                      top: elemento.pos_y,
                      zIndex: isSelected ? 25 : 10
                    }}
                  >
                    {/* Main element */}
                    <div
                      className={`cursor-move flex items-center justify-center shadow-md transition-all ${
                        elemento.forma === "circular" ? "rounded-full" : "rounded-md"
                      } ${draggingItem?.id === elemento.id ? "ring-2 ring-accent" : ""} ${
                        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{
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
                    
                    {/* Resize & Rotate handles when selected */}
                    {isSelected && (
                      <>
                        {/* Rotation handle */}
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md"
                          style={{ transform: `translateX(-50%)` }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const startY = e.clientY;
                            const startRotation = elemento.rotacion;
                            
                            const onMouseMove = (moveEvent: MouseEvent) => {
                              const deltaY = startY - moveEvent.clientY;
                              const newRotation = (startRotation + deltaY * 2) % 360;
                              setElementos(prev => prev.map(el => 
                                el.id === elemento.id ? { ...el, rotacion: newRotation } : el
                              ));
                            };
                            
                            const onMouseUp = async () => {
                              document.removeEventListener('mousemove', onMouseMove);
                              document.removeEventListener('mouseup', onMouseUp);
                              const el = elementos.find(e => e.id === elemento.id);
                              if (el) {
                                await supabase.from("elementos_planta").update({ rotacion: el.rotacion }).eq("id", elemento.id);
                              }
                            };
                            
                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                          }}
                        >
                          <RotateCw className="w-3 h-3 text-primary-foreground" />
                        </div>
                        
                        {/* Resize handle (bottom-right corner) */}
                        <div
                          className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center cursor-se-resize hover:scale-110 transition-transform shadow-md"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startWidth = elemento.ancho;
                            const startHeight = elemento.alto;
                            
                            const onMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaY = moveEvent.clientY - startY;
                              const newWidth = Math.max(30, startWidth + deltaX);
                              const newHeight = Math.max(15, startHeight + deltaY);
                              setElementos(prev => prev.map(el => 
                                el.id === elemento.id ? { ...el, ancho: newWidth, alto: newHeight } : el
                              ));
                            };
                            
                            const onMouseUp = async () => {
                              document.removeEventListener('mousemove', onMouseMove);
                              document.removeEventListener('mouseup', onMouseUp);
                              const el = elementos.find(e => e.id === elemento.id);
                              if (el) {
                                await supabase.from("elementos_planta").update({ ancho: el.ancho, alto: el.alto }).eq("id", elemento.id);
                              }
                            };
                            
                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                          }}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Render mesas (on top) */}
              {mesas.map((mesa) => {
                const orden = getMesaOrden(mesa.id);
                const isOccupied = !!orden;
                const isSelected = selectedElement?.id === mesa.id && selectedElement?.type === "mesa";
                
                return (
                  <div
                    key={mesa.id}
                    className="absolute"
                    style={{
                      left: mesa.pos_x,
                      top: mesa.pos_y,
                      zIndex: isSelected ? 35 : 20
                    }}
                  >
                    {/* Main mesa */}
                    <div
                      className={`cursor-pointer flex flex-col items-center justify-center shadow-lg transition-all ${getMesaShape(mesa.forma)} ${
                        draggingItem?.id === mesa.id ? "ring-2 ring-accent" : ""
                      } ${isSelected ? "ring-2 ring-offset-2" : ""} hover:scale-105`}
                      style={{
                        width: mesa.ancho,
                        height: mesa.alto,
                        backgroundColor: isOccupied ? "hsl(0 84% 60%)" : "hsl(142 71% 45%)",
                        color: "white"
                      }}
                      onMouseDown={(e) => handleMouseDown(e, mesa.id, "mesa", mesa.pos_x, mesa.pos_y)}
                      onClick={(e) => handleMesaClick(mesa, e)}
                      onDoubleClick={() => openEditMesaDialog(mesa)}
                    >
                      <span className="font-bold text-lg">#{mesa.numero_mesa}</span>
                      <span className="text-xs opacity-80">{mesa.capacidad}p</span>
                      {isOccupied && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-white text-red-600">
                          ${Math.round(orden.total / 1000)}k
                        </Badge>
                      )}
                    </div>
                    
                    {/* Resize handle when selected */}
                    {isSelected && (
                      <div
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center cursor-se-resize hover:scale-110 transition-transform shadow-md"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startWidth = mesa.ancho;
                          const startHeight = mesa.alto;
                          
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaY = moveEvent.clientY - startY;
                            const delta = Math.max(deltaX, deltaY);
                            const newSize = Math.max(40, startWidth + delta);
                            setMesas(prev => prev.map(m => 
                              m.id === mesa.id ? { ...m, ancho: newSize, alto: newSize } : m
                            ));
                          };
                          
                          const onMouseUp = async () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                            const m = mesas.find(me => me.id === mesa.id);
                            if (m) {
                              await supabase.from("mesas").update({ ancho: m.ancho, alto: m.alto }).eq("id", mesa.id);
                            }
                          };
                          
                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                      >
                        <Maximize2 className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

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
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Mesas ({mesas.length})
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-700">
              {mesas.filter(m => !getMesaOrden(m.id)).length} libres
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-700">
              {mesas.filter(m => getMesaOrden(m.id)).length} ocupadas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mesas.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay mesas configuradas aún.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mesas.map((mesa) => {
                const orden = getMesaOrden(mesa.id);
                return (
                  <div
                    key={mesa.id}
                    onClick={() => {
                      setSelectedMesaOrder({ mesa, orden });
                      setOrderComment(orden?.nombre_cliente || "");
                      setOrderSheetOpen(true);
                    }}
                    className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                      orden 
                        ? "bg-red-50 border-red-200 hover:bg-red-100" 
                        : "bg-green-50 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium">Mesa #{mesa.numero_mesa}</p>
                      <div className={`w-3 h-3 rounded-full ${orden ? "bg-red-500" : "bg-green-500"}`} />
                    </div>
                    {mesa.nombre && <p className="text-xs text-muted-foreground truncate">{mesa.nombre}</p>}
                    <p className="text-xs text-muted-foreground">{mesa.capacidad} personas</p>
                    {orden && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        Orden #{orden.numero_orden} • {formatPrice(orden.total)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Sheet - Panel lateral para gestionar orden de mesa */}
      <Sheet open={orderSheetOpen} onOpenChange={setOrderSheetOpen}>
        <SheetContent className="w-[400px] sm:max-w-[450px]">
          {selectedMesaOrder && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Mesa #{selectedMesaOrder.mesa.numero_mesa}
                  {selectedMesaOrder.mesa.nombre && (
                    <span className="font-normal text-muted-foreground">
                      ({selectedMesaOrder.mesa.nombre})
                    </span>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Status */}
                <div className={`p-4 rounded-lg ${selectedMesaOrder.orden ? "bg-red-50" : "bg-green-50"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${selectedMesaOrder.orden ? "bg-red-500" : "bg-green-500"}`} />
                    <span className="font-medium">
                      {selectedMesaOrder.orden ? "Mesa Ocupada" : "Mesa Libre"}
                    </span>
                  </div>
                  {selectedMesaOrder.orden && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Orden #{selectedMesaOrder.orden.numero_orden} • 
                      {format(new Date(selectedMesaOrder.orden.created_at), " HH:mm", { locale: es })}
                    </p>
                  )}
                </div>

                {selectedMesaOrder.orden ? (
                  <>
                    {/* Order Details */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Detalle de la Orden
                      </h4>
                      <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                        {selectedMesaOrder.orden.detalles.map((detalle) => (
                          <div key={detalle.id} className="p-3 flex justify-between">
                            <div>
                              <p className="font-medium text-sm">{detalle.nombre_item}</p>
                              <p className="text-xs text-muted-foreground">
                                {detalle.cantidad} x {formatPrice(detalle.precio_unitario)}
                              </p>
                            </div>
                            <span className="font-medium">{formatPrice(detalle.subtotal)}</span>
                          </div>
                        ))}
                        {selectedMesaOrder.orden.detalles.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            Sin items aún
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold p-3 bg-muted rounded-lg mt-2">
                        <span>Total</span>
                        <span>{formatPrice(selectedMesaOrder.orden.total)}</span>
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Comentarios
                      </Label>
                      <Textarea
                        value={orderComment}
                        onChange={(e) => setOrderComment(e.target.value)}
                        placeholder="Agregar notas sobre esta orden..."
                        rows={3}
                      />
                    </div>

                    {/* Time info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Abierta hace {Math.round((Date.now() - new Date(selectedMesaOrder.orden.created_at).getTime()) / 60000)} min
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Esta mesa está disponible</p>
                    <p className="text-sm">Capacidad: {selectedMesaOrder.mesa.capacidad} personas</p>
                  </div>
                )}
              </div>

              <SheetFooter className="gap-2">
                <Button variant="outline" onClick={() => openEditMesaDialog(selectedMesaOrder.mesa)}>
                  Editar Mesa
                </Button>
                {selectedMesaOrder.orden && (
                  <Button onClick={handleCloseOrder} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Cerrar Orden
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

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
                    <SelectItem value="225">225°</SelectItem>
                    <SelectItem value="270">270°</SelectItem>
                    <SelectItem value="315">315°</SelectItem>
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
