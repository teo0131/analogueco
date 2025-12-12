import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, Sparkles, X, Maximize2, Minimize2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AIAction = {
  type: "menu_item" | "proveedor" | "producto";
  data: Record<string, any>;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const QUICK_ACTIONS = [
  { label: "📦 Agregar item al menú", prompt: "Quiero agregar un nuevo producto al menú llamado Cappuccino a $8000" },
  { label: "🏢 Nuevo proveedor", prompt: "Necesito registrar un nuevo proveedor: " },
  { label: "💰 ¿Cómo uso el POS?", prompt: "¿Cómo funciona el módulo de punto de venta?" },
  { label: "🍳 Crear receta", prompt: "Quiero crear una receta para " },
  { label: "📊 Ver historial de ventas", prompt: "¿Cuál fue mi historial de ventas de hoy?" },
  { label: "💵 Cambiar precios", prompt: "Quiero cambiar el precio del producto " },
  { label: "📈 Resumen de mi negocio", prompt: "Dame un resumen del estado actual de mi negocio" },
  { label: "❓ ¿Qué puedo hacer aquí?", prompt: "¿Qué funciones tiene AnalogueCo y cómo las uso?" },
];

// Extract JSON actions from AI response
const extractActions = (content: string): AIAction[] => {
  const actions: AIAction[] = [];
  const jsonRegex = /```json\s*([\s\S]*?)```/g;
  let match;

  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.type && parsed.data) {
        actions.push(parsed as AIAction);
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  return actions;
};

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Execute AI actions automatically
  const executeAction = async (action: AIAction): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para realizar esta acción",
          variant: "destructive",
        });
        return false;
      }

      switch (action.type) {
        case "menu_item": {
          const { error } = await supabase.from("menu_items").insert({
            user_id: user.id,
            nombre: action.data.nombre,
            precio: action.data.precio || 0,
            categoria: action.data.categoria || null,
            descripcion: action.data.descripcion || null,
          });
          if (error) throw error;
          toast({
            title: "✅ Item agregado al menú",
            description: `"${action.data.nombre}" por $${action.data.precio?.toLocaleString() || 0}`,
          });
          return true;
        }

        case "proveedor": {
          const { error } = await supabase.from("proveedores").insert({
            user_id: user.id,
            nombre: action.data.nombre,
            documento: action.data.documento || null,
            contacto: action.data.contacto || null,
            observaciones: action.data.observaciones || null,
          });
          if (error) throw error;
          toast({
            title: "✅ Proveedor registrado",
            description: `"${action.data.nombre}" agregado correctamente`,
          });
          return true;
        }

        case "producto": {
          const { error } = await supabase.from("productos").insert({
            user_id: user.id,
            nombre: action.data.nombre,
            unidad_inventario: action.data.unidad_inventario || "unidades",
            stock_minimo: action.data.stock_minimo || 0,
            categoria: action.data.categoria || null,
            tipo_producto: action.data.tipo_producto || "retail",
          });
          if (error) throw error;
          toast({
            title: "✅ Producto creado",
            description: `"${action.data.nombre}" agregado al inventario`,
          });
          return true;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error("Error executing action:", error);
      toast({
        title: "Error",
        description: `No se pudo ejecutar la acción: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (resp.status === 429) {
      throw new Error("Límite de solicitudes excedido. Intenta de nuevo en unos momentos.");
    }
    if (resp.status === 402) {
      throw new Error("Créditos de IA agotados. Contacta al administrador.");
    }
    if (!resp.ok || !resp.body) {
      throw new Error("Error al conectar con el asistente");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  // Save conversation to database
  const saveConversation = async (updatedMessages: Message[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (conversationId) {
        await supabase
          .from("chat_conversations")
          .update({ 
            messages: updatedMessages as unknown as any,
            updated_at: new Date().toISOString()
          })
          .eq("id", conversationId);
      } else {
        const { data, error } = await supabase
          .from("chat_conversations")
          .insert({
            user_id: user.id,
            user_email: user.email,
            messages: updatedMessages as unknown as any,
          })
          .select("id")
          .single();

        if (data && !error) {
          setConversationId(data.id);
        }
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const messageText = customPrompt || input.trim();
    if (!messageText) return;

    const userMsg: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const assistantResponse = await streamChat(updatedMessages);
      
      // Check for actions in the response and execute them
      const actions = extractActions(assistantResponse);
      for (const action of actions) {
        const actionKey = `${action.type}-${JSON.stringify(action.data)}`;
        if (!executedActions.includes(actionKey)) {
          const success = await executeAction(action);
          if (success) {
            setExecutedActions(prev => [...prev, actionKey]);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save messages when they change (after streaming completes)
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      saveConversation(messages);
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format message content - hide JSON blocks completely
  const formatMessageContent = (content: string) => {
    // Remove JSON blocks entirely and show executed action indicator
    const formatted = content.replace(/```json\s*\{[\s\S]*?\}```/g, (match) => {
      try {
        const jsonMatch = match.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed.type && parsed.data) {
            const actionKey = `${parsed.type}-${JSON.stringify(parsed.data)}`;
            const wasExecuted = executedActions.includes(actionKey);
            return wasExecuted ? "✅ ¡Listo!" : "";
          }
        }
      } catch {
        // Hide anyway if it looks like action JSON
      }
      return "";
    });
    // Clean up extra whitespace
    return formatted.replace(/\n{3,}/g, "\n\n").trim();
  };

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-300 border-0 shadow-none bg-transparent",
      isExpanded ? "h-[600px]" : "h-[350px]"
    )}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between px-4 pt-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Asistente IA de AnalogueCo
          <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMessages([]);
                setConversationId(null);
                setExecutedActions([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden px-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">¡Hola! Soy tu asistente de IA</h3>
                <p className="text-sm text-muted-foreground">
                  Puedo agregar productos, registrar proveedores y más. ¡Solo dime qué necesitas!
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Badge
                  key={action.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors py-1.5 px-3"
                  onClick={() => setInput(action.prompt)}
                >
                  {action.label}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.role === "assistant" ? formatMessageContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Agrega un Cappuccino a $8000 al menú..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};