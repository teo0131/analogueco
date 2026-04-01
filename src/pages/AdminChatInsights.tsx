import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  BarChart3,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatConversation = {
  id: string;
  user_id: string;
  user_email: string | null;
  messages: ChatMessage[];
  summary: string | null;
  created_at: string;
  updated_at: string;
  comercio_id?: string | null;
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const AdminChatInsights = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["admin-chat-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ChatConversation[];
    },
  });

  // Analyze user questions for insights
  const insights = (() => {
    if (!conversations) return { keywords: [], categories: [], topQuestions: [], metrics: { total: 0, users: 0, avgMessages: 0 } };

    const allUserMessages: string[] = [];
    const userSet = new Set<string>();

    conversations.forEach((conv) => {
      userSet.add(conv.user_id);
      const messages = conv.messages || [];
      messages.forEach((msg) => {
        if (msg.role === "user") {
          allUserMessages.push(msg.content);
        }
      });
    });

    // Extract keywords and patterns
    const keywordPatterns: Record<string, { count: number; category: string }> = {
      "menú": { count: 0, category: "Menu" },
      "menu": { count: 0, category: "Menu" },
      "producto": { count: 0, category: "Productos" },
      "productos": { count: 0, category: "Productos" },
      "proveedor": { count: 0, category: "Proveedores" },
      "proveedores": { count: 0, category: "Proveedores" },
      "receta": { count: 0, category: "Recetas" },
      "recetas": { count: 0, category: "Recetas" },
      "inventario": { count: 0, category: "Inventario" },
      "stock": { count: 0, category: "Inventario" },
      "factura": { count: 0, category: "Facturación" },
      "facturar": { count: 0, category: "Facturación" },
      "pos": { count: 0, category: "POS" },
      "venta": { count: 0, category: "Ventas" },
      "ventas": { count: 0, category: "Ventas" },
      "cómo": { count: 0, category: "Ayuda" },
      "como": { count: 0, category: "Ayuda" },
      "ayuda": { count: 0, category: "Ayuda" },
      "agregar": { count: 0, category: "Acciones" },
      "crear": { count: 0, category: "Acciones" },
      "nuevo": { count: 0, category: "Acciones" },
      "eliminar": { count: 0, category: "Acciones" },
      "editar": { count: 0, category: "Acciones" },
      "precio": { count: 0, category: "Precios" },
      "precios": { count: 0, category: "Precios" },
      "reporte": { count: 0, category: "Reportes" },
      "reportes": { count: 0, category: "Reportes" },
      "excel": { count: 0, category: "Exportación" },
      "exportar": { count: 0, category: "Exportación" },
    };

    const categoryCount: Record<string, number> = {};

    allUserMessages.forEach((msg) => {
      const lowerMsg = msg.toLowerCase();
      Object.entries(keywordPatterns).forEach(([keyword, { category }]) => {
        if (lowerMsg.includes(keyword)) {
          keywordPatterns[keyword].count++;
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });
    });

    // Sort keywords by frequency
    const sortedKeywords = Object.entries(keywordPatterns)
      .filter(([_, { count }]) => count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([keyword, { count, category }]) => ({ keyword, count, category }));

    // Category distribution
    const categories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Top questions (unique user messages)
    const questionCount: Record<string, number> = {};
    allUserMessages.forEach((msg) => {
      const normalized = msg.trim().toLowerCase().slice(0, 100);
      questionCount[normalized] = (questionCount[normalized] || 0) + 1;
    });

    const topQuestions = Object.entries(questionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    const totalMessages = conversations.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0);

    return {
      keywords: sortedKeywords,
      categories,
      topQuestions,
      metrics: {
        total: conversations.length,
        users: userSet.size,
        avgMessages: conversations.length > 0 ? Math.round(totalMessages / conversations.length) : 0,
      },
    };
  })();

  const filteredConversations = conversations?.filter((conv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const emailMatch = conv.user_email?.toLowerCase().includes(search);
    const messageMatch = conv.messages?.some((msg) => 
      msg.content.toLowerCase().includes(search)
    );
    return emailMatch || messageMatch;
  });

  const toggleConversation = (id: string) => {
    setExpandedConversations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Analytics del Asistente IA
        </h1>
        <p className="text-muted-foreground">
          Visualiza las conversaciones y obtén insights de los usuarios
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversaciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.metrics.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Mensajes/Conv</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.metrics.avgMessages}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
                <CardDescription>Temas más consultados por los usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={insights.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {insights.categories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos suficientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Palabras Clave Más Usadas</CardTitle>
                <CardDescription>Frecuencia de términos en las consultas</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.keywords.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={insights.keywords} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="keyword" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Menciones" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos suficientes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feature Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Oportunidades de Mejora
              </CardTitle>
              <CardDescription>
                Basado en las consultas de los usuarios, estas funcionalidades podrían agregar valor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.categories.length > 0 ? (
                  <>
                    {insights.categories.slice(0, 3).map((cat, i) => (
                      <div key={cat.name} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Badge variant={i === 0 ? "default" : "secondary"}>
                          #{i + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cat.value} menciones - Los usuarios consultan frecuentemente sobre {cat.name.toLowerCase()}.
                            {cat.name === "Ayuda" && " Considera agregar tutoriales interactivos o guías paso a paso."}
                            {cat.name === "Exportación" && " Podrías expandir las opciones de exportación a más formatos."}
                            {cat.name === "Reportes" && " Más opciones de reportes personalizados serían valoradas."}
                            {cat.name === "Inventario" && " Alertas automáticas y predicciones de stock podrían ayudar."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aún no hay suficientes conversaciones para generar insights.
                    Los usuarios deben interactuar con el asistente para obtener datos.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Preguntas Más Frecuentes</CardTitle>
              <CardDescription>Lo que los usuarios preguntan más seguido</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.topQuestions.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {insights.topQuestions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm truncate flex-1 mr-4">{q.question}</p>
                        <Badge variant="outline">{q.count}x</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No hay preguntas registradas
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Conversations List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredConversations?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No hay conversaciones registradas
                </div>
              ) : (
                filteredConversations?.map((conv) => (
                  <Card key={conv.id} className="overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                      onClick={() => toggleConversation(conv.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {conv.user_email || "Usuario anónimo"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(conv.updated_at), "dd MMM yyyy, HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {conv.messages?.length || 0} mensajes
                          </Badge>
                          {expandedConversations.has(conv.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {expandedConversations.has(conv.id) && (
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-3 mt-2 border-t pt-4">
                          {conv.messages?.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminChatInsights;