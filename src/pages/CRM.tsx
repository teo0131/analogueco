import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle, Mail, Phone, User, Plus, Send, Search, Filter,
  CheckCircle2, Clock, AlertCircle, Bot, Bike, Tag, RefreshCw,
  StickyNote, Archive, Users, MoreVertical, X,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CrmContacto {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  canal_principal?: string;
  etiquetas?: string[];
  total_pedidos: number;
  total_gastado: number;
  ultimo_contacto?: string;
  estado: string;
  notas?: string;
  created_at: string;
}

interface CrmConversacion {
  id: string;
  canal: string;
  canal_referencia?: string;
  estado: string;
  asunto?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  total_mensajes: number;
  ultimo_mensaje?: string;
  ultimo_mensaje_at?: string;
  contacto_id?: string;
  domicilio_id?: string;
  created_at: string;
}

interface CrmMensaje {
  id: string;
  rol: string;
  canal: string;
  contenido: string;
  tipo_contenido: string;
  leido: boolean;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const CANAL_ICON: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
  nota_interna: StickyNote,
  telefono: Phone,
};

const CANAL_COLOR: Record<string, string> = {
  whatsapp: "text-green-600",
  email: "text-blue-600",
  nota_interna: "text-amber-600",
  telefono: "text-purple-600",
};

const ESTADO_CONV_COLOR: Record<string, string> = {
  abierto: "bg-green-500/20 text-green-700 dark:text-green-400",
  cerrado: "bg-muted text-muted-foreground",
  pendiente: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  bot: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
};

const ROL_COLOR: Record<string, string> = {
  cliente: "bg-muted",
  agente: "bg-primary/10 ml-auto",
  bot: "bg-purple-500/10 ml-auto",
};

// ─────────────────────────────────────────────────────────────────────────────
export default function CRM() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConv, setSelectedConv] = useState<CrmConversacion | null>(null);
  const [selectedContacto, setSelectedContacto] = useState<CrmContacto | null>(null);
  const [activeTab, setActiveTab] = useState<"conversaciones" | "contactos">("conversaciones");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCanal, setFilterCanal] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [newMessage, setNewMessage] = useState("");
  const [showNewConvDialog, setShowNewConvDialog] = useState(false);
  const [showNewContactoDialog, setShowNewContactoDialog] = useState(false);

  // New conversation form
  const [newConvForm, setNewConvForm] = useState({ canal: "whatsapp", nombre: "", telefono: "", asunto: "" });
  // New contacto form
  const [newContactoForm, setNewContactoForm] = useState({ nombre: "", telefono: "", email: "", canal_principal: "whatsapp", notas: "" });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: conversaciones = [], isLoading: loadingConvs, refetch: refetchConvs } = useQuery({
    queryKey: ["crm-conversaciones", filterCanal, filterEstado],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let q = supabase.from("crm_conversaciones").select("*").eq("user_id", user.id).order("ultimo_mensaje_at", { ascending: false, nullsFirst: false });
      if (filterCanal !== "todos") q = q.eq("canal", filterCanal);
      if (filterEstado !== "todos") q = q.eq("estado", filterEstado);
      const { data, error } = await q;
      if (error) throw error;
      return data as CrmConversacion[];
    },
    refetchInterval: 10000,
  });

  const { data: contactos = [], isLoading: loadingContactos, refetch: refetchContactos } = useQuery({
    queryKey: ["crm-contactos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from("crm_contactos").select("*").eq("user_id", user.id).order("ultimo_contacto", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as CrmContacto[];
    },
  });

  const { data: mensajes = [], refetch: refetchMensajes } = useQuery({
    queryKey: ["crm-mensajes", selectedConv?.id],
    enabled: !!selectedConv,
    queryFn: async () => {
      if (!selectedConv) return [];
      const { data, error } = await supabase.from("crm_mensajes").select("*").eq("conversacion_id", selectedConv.id).order("created_at", { ascending: true });
      if (error) throw error;
      // Mark as read
      await supabase.from("crm_mensajes").update({ leido: true }).eq("conversacion_id", selectedConv.id).eq("leido", false);
      return data as CrmMensaje[];
    },
    refetchInterval: 5000,
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedConv) throw new Error("No autenticado");
      const contenido = newMessage.trim();
      if (!contenido) throw new Error("Mensaje vacío");

      await supabase.from("crm_mensajes").insert({
        conversacion_id: selectedConv.id,
        user_id: user.id,
        rol: "agente",
        canal: selectedConv.canal,
        contenido,
      });

      // Update conversation stats
      await supabase.from("crm_conversaciones").update({
        ultimo_mensaje: contenido.substring(0, 200),
        ultimo_mensaje_at: new Date().toISOString(),
        total_mensajes: (selectedConv.total_mensajes ?? 0) + 1,
        estado: "abierto",
      }).eq("id", selectedConv.id);

      // If WhatsApp conversation, try to send via WA
      if (selectedConv.canal === "whatsapp" && selectedConv.telefono_cliente) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("whatsapp_phone_number_id, whatsapp_access_token")
          .eq("user_id", user.id)
          .maybeSingle();
        if (settings?.whatsapp_phone_number_id && settings?.whatsapp_access_token) {
          await fetch(`https://graph.facebook.com/v19.0/${settings.whatsapp_phone_number_id}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${settings.whatsapp_access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: selectedConv.telefono_cliente,
              type: "text",
              text: { body: contenido },
            }),
          });
        }
      }
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["crm-mensajes", selectedConv?.id] });
      queryClient.invalidateQueries({ queryKey: ["crm-conversaciones"] });
    },
    onError: (e: Error) => toast.error(e.message || "Error al enviar"),
  });

  const createContactoMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("crm_contactos").insert({
        user_id: user.id,
        nombre: newContactoForm.nombre,
        telefono: newContactoForm.telefono || null,
        email: newContactoForm.email || null,
        canal_principal: newContactoForm.canal_principal,
        notas: newContactoForm.notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contactos"] });
      toast.success("Contacto creado");
      setShowNewContactoDialog(false);
      setNewContactoForm({ nombre: "", telefono: "", email: "", canal_principal: "whatsapp", notas: "" });
    },
    onError: () => toast.error("Error al crear contacto"),
  });

  const createConvMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("crm_conversaciones").insert({
        user_id: user.id,
        canal: newConvForm.canal,
        nombre_cliente: newConvForm.nombre || null,
        telefono_cliente: newConvForm.telefono || null,
        asunto: newConvForm.asunto || null,
        estado: "abierto",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-conversaciones"] });
      toast.success("Conversación creada");
      setShowNewConvDialog(false);
      setNewConvForm({ canal: "whatsapp", nombre: "", telefono: "", asunto: "" });
    },
    onError: () => toast.error("Error al crear conversación"),
  });

  const updateConvEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("crm_conversaciones").update({ estado }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-conversaciones"] });
      toast.success("Estado actualizado");
    },
  });

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filteredConvs = conversaciones.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (c.nombre_cliente ?? "").toLowerCase().includes(s) ||
      (c.telefono_cliente ?? "").includes(s) ||
      (c.asunto ?? "").toLowerCase().includes(s) ||
      (c.ultimo_mensaje ?? "").toLowerCase().includes(s);
  });

  const filteredContactos = contactos.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return c.nombre.toLowerCase().includes(s) ||
      (c.telefono ?? "").includes(s) ||
      (c.email ?? "").toLowerCase().includes(s);
  });

  const unreadCount = conversaciones.filter((c) => c.estado !== "cerrado" && c.estado !== "bot").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">CRM Multi-canal</h1>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
              {unreadCount} activas
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchConvs(); refetchContactos(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => activeTab === "conversaciones" ? setShowNewConvDialog(true) : setShowNewContactoDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {activeTab === "conversaciones" ? "Nueva conversación" : "Nuevo contacto"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-3 mt-3 mb-0">
              <TabsTrigger value="conversaciones" className="flex-1 text-xs">
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> Conversaciones
              </TabsTrigger>
              <TabsTrigger value="contactos" className="flex-1 text-xs">
                <Users className="h-3.5 w-3.5 mr-1" /> Contactos
              </TabsTrigger>
            </TabsList>

            {/* Search & filters */}
            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {activeTab === "conversaciones" && (
                <div className="flex gap-2">
                  <Select value={filterCanal} onValueChange={setFilterCanal}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Canal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="nota_interna">Notas</SelectItem>
                      <SelectItem value="telefono">Teléfono</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="abierto">Abiertos</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="bot">Bot</SelectItem>
                      <SelectItem value="cerrado">Cerrados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="conversaciones" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                {loadingConvs ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
                ) : filteredConvs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No hay conversaciones
                  </div>
                ) : (
                  filteredConvs.map((conv) => {
                    const CanalIcon = CANAL_ICON[conv.canal] ?? MessageCircle;
                    return (
                      <button
                        key={conv.id}
                        className={`w-full text-left px-3 py-3 border-b border-border hover:bg-accent/50 transition-colors ${selectedConv?.id === conv.id ? "bg-accent" : ""}`}
                        onClick={() => setSelectedConv(conv)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CanalIcon className={`h-4 w-4 shrink-0 ${CANAL_COLOR[conv.canal] ?? "text-muted-foreground"}`} />
                            <span className="text-sm font-medium truncate">{conv.nombre_cliente ?? conv.telefono_cliente ?? "Sin nombre"}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ESTADO_CONV_COLOR[conv.estado] ?? ""}`}>
                              {conv.estado}
                            </span>
                            {conv.ultimo_mensaje_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conv.ultimo_mensaje_at), { locale: es, addSuffix: false })}
                              </span>
                            )}
                          </div>
                        </div>
                        {conv.ultimo_mensaje && (
                          <p className="text-xs text-muted-foreground mt-1 truncate pl-6">{conv.ultimo_mensaje}</p>
                        )}
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="contactos" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                {loadingContactos ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
                ) : filteredContactos.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No hay contactos
                  </div>
                ) : (
                  filteredContactos.map((c) => {
                    const CanalIcon = CANAL_ICON[c.canal_principal ?? "whatsapp"] ?? MessageCircle;
                    return (
                      <button
                        key={c.id}
                        className={`w-full text-left px-3 py-3 border-b border-border hover:bg-accent/50 transition-colors ${selectedContacto?.id === c.id ? "bg-accent" : ""}`}
                        onClick={() => setSelectedContacto(c)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.nombre}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CanalIcon className={`h-3 w-3 ${CANAL_COLOR[c.canal_principal ?? "whatsapp"]}`} />
                              <span>{c.telefono ?? c.email ?? "Sin contacto"}</span>
                            </div>
                          </div>
                          <div className="ml-auto text-right shrink-0">
                            <p className="text-xs font-medium">{c.total_pedidos} pedidos</p>
                            <p className="text-xs text-muted-foreground">${c.total_gastado.toLocaleString()}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "conversaciones" && selectedConv ? (
            <>
              {/* Conv header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => { const Icon = CANAL_ICON[selectedConv.canal] ?? MessageCircle; return <Icon className={`h-5 w-5 ${CANAL_COLOR[selectedConv.canal]}`} />; })()}
                  <div>
                    <p className="font-semibold text-sm">{selectedConv.nombre_cliente ?? selectedConv.telefono_cliente ?? "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.canal} · {selectedConv.total_mensajes} mensajes
                      {selectedConv.telefono_cliente && ` · ${selectedConv.telefono_cliente}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_CONV_COLOR[selectedConv.estado] ?? ""}`}>
                    {selectedConv.estado}
                  </span>
                  {selectedConv.estado !== "cerrado" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => updateConvEstadoMutation.mutate({ id: selectedConv.id, estado: "cerrado" })}
                    >
                      <Archive className="h-3.5 w-3.5 mr-1" /> Cerrar
                    </Button>
                  )}
                  {selectedConv.estado === "cerrado" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => updateConvEstadoMutation.mutate({ id: selectedConv.id, estado: "abierto" })}
                    >
                      Reabrir
                    </Button>
                  )}
                  {selectedConv.domicilio_id && (
                    <span className="text-xs flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
                      <Bike className="h-3.5 w-3.5" /> Domicilio vinculado
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {mensajes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No hay mensajes aún</div>
                ) : (
                  <div className="space-y-3">
                    {mensajes.map((msg) => {
                      const isAgent = msg.rol === "agente" || msg.rol === "bot";
                      return (
                        <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isAgent ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {msg.rol === "bot" && (
                              <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                                <Bot className="h-3 w-3" /> IA
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                            <p className={`text-xs mt-1 ${isAgent ? "opacity-70 text-right" : "text-muted-foreground"}`}>
                              {format(new Date(msg.created_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    className="resize-none text-sm"
                    rows={2}
                    placeholder={selectedConv.canal === "whatsapp" ? "Responder por WhatsApp..." : selectedConv.canal === "email" ? "Escribir email..." : "Agregar nota interna..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) sendMessageMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-full aspect-square"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    onClick={() => sendMessageMutation.mutate()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Enter para enviar · Shift+Enter para nueva línea</p>
              </div>
            </>
          ) : activeTab === "contactos" && selectedContacto ? (
            /* Contacto detail */
            <div className="p-6 overflow-y-auto">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedContacto.nombre}</h2>
                    <p className="text-sm text-muted-foreground">{selectedContacto.canal_principal ?? "whatsapp"}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                    <p>{selectedContacto.telefono ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p>{selectedContacto.email ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total pedidos</p>
                    <p className="font-semibold">{selectedContacto.total_pedidos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total gastado</p>
                    <p className="font-semibold">${selectedContacto.total_gastado.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estado</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedContacto.estado === "activo" ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {selectedContacto.estado}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Último contacto</p>
                    <p>{selectedContacto.ultimo_contacto ? formatDistanceToNow(new Date(selectedContacto.ultimo_contacto), { locale: es, addSuffix: true }) : "—"}</p>
                  </div>
                </div>
                {selectedContacto.etiquetas && selectedContacto.etiquetas.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Etiquetas</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedContacto.etiquetas.map((tag) => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag className="h-3 w-3" />{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedContacto.notas && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm bg-muted rounded-md p-3">{selectedContacto.notas}</p>
                  </div>
                )}
                {/* Conversations of this contact */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conversaciones</p>
                  {conversaciones.filter((c) => c.contacto_id === selectedContacto.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin conversaciones vinculadas</p>
                  ) : (
                    conversaciones.filter((c) => c.contacto_id === selectedContacto.id).map((conv) => {
                      const Icon = CANAL_ICON[conv.canal] ?? MessageCircle;
                      return (
                        <button
                          key={conv.id}
                          className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-accent text-sm"
                          onClick={() => { setActiveTab("conversaciones"); setSelectedConv(conv); }}
                        >
                          <Icon className={`h-4 w-4 ${CANAL_COLOR[conv.canal]}`} />
                          <span className="flex-1 truncate">{conv.asunto ?? conv.ultimo_mensaje ?? conv.canal}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${ESTADO_CONV_COLOR[conv.estado]}`}>{conv.estado}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Selecciona una {activeTab === "conversaciones" ? "conversación" : "contacto"} para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConvDialog} onOpenChange={setShowNewConvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Conversación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={newConvForm.canal} onValueChange={(v) => setNewConvForm((p) => ({ ...p, canal: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                  <SelectItem value="nota_interna">Nota Interna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre del cliente</Label>
              <Input value={newConvForm.nombre} onChange={(e) => setNewConvForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono / Email</Label>
              <Input value={newConvForm.telefono} onChange={(e) => setNewConvForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="+57 300..." />
            </div>
            <div className="space-y-2">
              <Label>Asunto (opcional)</Label>
              <Input value={newConvForm.asunto} onChange={(e) => setNewConvForm((p) => ({ ...p, asunto: e.target.value }))} placeholder="Consulta sobre pedido..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConvDialog(false)}>Cancelar</Button>
            <Button disabled={createConvMutation.isPending} onClick={() => createConvMutation.mutate()}>
              Crear conversación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Contacto Dialog */}
      <Dialog open={showNewContactoDialog} onOpenChange={setShowNewContactoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={newContactoForm.nombre} onChange={(e) => setNewContactoForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={newContactoForm.telefono} onChange={(e) => setNewContactoForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="+57 300..." />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newContactoForm.email} onChange={(e) => setNewContactoForm((p) => ({ ...p, email: e.target.value }))} placeholder="cliente@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Canal principal</Label>
              <Select value={newContactoForm.canal_principal} onValueChange={(v) => setNewContactoForm((p) => ({ ...p, canal_principal: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={newContactoForm.notas} onChange={(e) => setNewContactoForm((p) => ({ ...p, notas: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewContactoDialog(false)}>Cancelar</Button>
            <Button disabled={!newContactoForm.nombre.trim() || createContactoMutation.isPending} onClick={() => createContactoMutation.mutate()}>
              Crear contacto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
