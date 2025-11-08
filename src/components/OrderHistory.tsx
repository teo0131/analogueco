import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronRight } from "lucide-react";

export interface CompletedOrder {
  id: number;
  orderNumber: number;
  items: Array<{ name: string; price: number }>;
  total: number;
  comment: string;
  timestamp: Date;
}

interface OrderHistoryProps {
  orders: CompletedOrder[];
  onSelectOrder: (order: CompletedOrder) => void;
}

export const OrderHistory = ({ orders, onSelectOrder }: OrderHistoryProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader className="bg-secondary">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Órdenes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 px-4">
              No hay órdenes completadas aún
            </p>
          ) : (
            <div className="space-y-2 p-4">
              {orders.map((order) => (
                <Button
                  key={order.id}
                  variant="outline"
                  onClick={() => onSelectOrder(order)}
                  className="w-full h-auto flex items-center justify-between p-4 hover:bg-muted"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary">Orden #{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(order.timestamp)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-lg font-bold mt-1">{formatPrice(order.total)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0" />
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
