import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { History, ChevronRight, Trash2, FileText, AlertTriangle } from "lucide-react";

export interface CompletedOrder {
  id: string | number;
  orderNumber: number;
  items: Array<{ name: string; price: number }>;
  total: number;
  comment: string;
  timestamp: Date;
}

interface OrderHistoryProps {
  orders: CompletedOrder[];
  onSelectOrder: (order: CompletedOrder) => void;
  onDeleteOrder: (orderId: string | number) => void;
  onGenerateInvoice?: (order: CompletedOrder) => void;
}

export const OrderHistory = ({ orders, onSelectOrder, onDeleteOrder, onGenerateInvoice }: OrderHistoryProps) => {
  const [orderToDelete, setOrderToDelete] = useState<CompletedOrder | null>(null);

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

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  return (
    <>
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
                  <div key={order.id} className="relative group">
                    <Button
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
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {onGenerateInvoice && (
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateInvoice(order);
                          }}
                          title="Generar Factura"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderToDelete(order);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar orden */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Eliminar Orden #{orderToDelete?.orderNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Estás a punto de eliminar esta orden por un valor de{" "}
                <strong>{orderToDelete && formatPrice(orderToDelete.total)}</strong>.
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
                <p className="font-semibold text-destructive mb-1">⚠️ Advertencia importante:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Esta orden <strong>NO se contará</strong> en las ventas del día</li>
                  <li><strong>NO aparecerá</strong> en los reportes de Excel</li>
                  <li><strong>NO será incluida</strong> en el cálculo de utilidades</li>
                  <li>La orden se moverá a "Órdenes Eliminadas" donde podrás restaurarla si lo necesitas</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, eliminar orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
