import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileDown, Cloud, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OrderDetail {
  id: string;
  nombre_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Order {
  id: string;
  numero_orden: number;
  fecha: string;
  total: number;
  comentario: string | null;
  detalles: OrderDetail[];
}

const HistorialDiario = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingToDrive, setSavingToDrive] = useState(false);

  useEffect(() => {
    fetchOrdersForDate();
  }, [selectedDate]);

  const fetchOrdersForDate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      const { data: ordersData, error: ordersError } = await supabase
        .from("ordenes_pos")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", dayStart)
        .lte("fecha", dayEnd)
        .order("fecha", { ascending: true });

      if (ordersError) throw ordersError;

      const ordersWithDetails: Order[] = [];

      for (const order of ordersData || []) {
        const { data: detalles, error: detallesError } = await supabase
          .from("detalle_ordenes_pos")
          .select("*")
          .eq("orden_id", order.id);

        if (detallesError) throw detallesError;

        ordersWithDetails.push({
          ...order,
          detalles: detalles || [],
        });
      }

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const totalDiario = orders.reduce((sum, order) => sum + Number(order.total), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleExportToExcel = () => {
    if (orders.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay órdenes para exportar en esta fecha",
        variant: "destructive",
      });
      return;
    }

    const exportData: any[] = [];

    orders.forEach((order) => {
      order.detalles.forEach((detalle) => {
        exportData.push({
          "Número de Orden": order.numero_orden,
          "Hora": format(new Date(order.fecha), "HH:mm:ss"),
          "Producto": detalle.nombre_item,
          "Cantidad": detalle.cantidad,
          "Precio Unitario": detalle.precio_unitario,
          "Subtotal": detalle.subtotal,
          "Total Orden": order.total,
          "Comentario": order.comentario || "",
        });
      });
    });

    exportData.push({
      "Número de Orden": "",
      "Hora": "",
      "Producto": "TOTAL DEL DÍA",
      "Cantidad": "",
      "Precio Unitario": "",
      "Subtotal": "",
      "Total Orden": totalDiario,
      "Comentario": "",
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Órdenes");

    const fileName = `ordenes_${format(selectedDate, "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Exportado",
      description: `Archivo ${fileName} descargado correctamente`,
    });
  };

  const handleSaveToGoogleDrive = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu URL de webhook de Zapier",
        variant: "destructive",
      });
      return;
    }

    if (orders.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay órdenes para guardar en esta fecha",
        variant: "destructive",
      });
      return;
    }

    setSavingToDrive(true);

    try {
      const exportData = orders.map((order) => ({
        numero_orden: order.numero_orden,
        fecha: format(new Date(order.fecha), "yyyy-MM-dd HH:mm:ss"),
        total: order.total,
        comentario: order.comentario,
        detalles: order.detalles.map((d) => ({
          producto: d.nombre_item,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
        })),
      }));

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          fecha: format(selectedDate, "yyyy-MM-dd"),
          total_diario: totalDiario,
          ordenes: exportData,
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: "Enviado",
        description: "Los datos fueron enviados a Zapier. Verifica tu Google Drive.",
      });
    } catch (error) {
      console.error("Error saving to Google Drive:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar a Google Drive",
        variant: "destructive",
      });
    } finally {
      setSavingToDrive(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Historial Diario</h1>
          <div className="w-20" />
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {orders.length} orden{orders.length !== 1 ? "es" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                disabled={selectedDate >= new Date()}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Button onClick={handleExportToExcel} className="flex-1">
                <FileDown className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="webhook" className="text-sm">
                  Webhook Zapier (para Google Drive)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook"
                    placeholder="https://hooks.zapier.com/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button
                    onClick={handleSaveToGoogleDrive}
                    disabled={savingToDrive}
                    variant="secondary"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    {savingToDrive ? "Enviando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No hay órdenes para esta fecha</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Collapsible
                key={order.id}
                open={expandedOrders.has(order.id)}
                onOpenChange={() => toggleOrderExpanded(order.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            #{order.numero_orden}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {format(new Date(order.fecha), "HH:mm:ss")}
                            </p>
                            {order.comentario && (
                              <p className="text-sm text-muted-foreground">
                                {order.comentario}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-foreground">
                            {formatPrice(Number(order.total))}
                          </p>
                          {expandedOrders.has(order.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-sm text-muted-foreground">
                              <th className="pb-2">Producto</th>
                              <th className="pb-2 text-center">Cantidad</th>
                              <th className="pb-2 text-right">Precio</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.detalles.map((detalle) => (
                              <tr key={detalle.id} className="border-b border-muted last:border-0">
                                <td className="py-2 text-foreground">{detalle.nombre_item}</td>
                                <td className="py-2 text-center text-foreground">{detalle.cantidad}</td>
                                <td className="py-2 text-right text-muted-foreground">
                                  {formatPrice(Number(detalle.precio_unitario))}
                                </td>
                                <td className="py-2 text-right font-medium text-foreground">
                                  {formatPrice(Number(detalle.subtotal))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}

            {/* Daily Total */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total del día</p>
                    <p className="text-sm text-muted-foreground">
                      {orders.length} orden{orders.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(totalDiario)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialDiario;
