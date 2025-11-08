import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompletedOrder } from "./OrderHistory";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderDetailProps {
  order: CompletedOrder | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetail = ({ order, open, onClose }: OrderDetailProps) => {
  if (!order) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Orden #{order.orderNumber}</DialogTitle>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.timestamp)}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2">
                <span className="font-medium">{item.name}</span>
                <span className="font-bold text-primary">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span className="text-primary">{formatPrice(order.total)}</span>
        </div>

        {order.comment && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-semibold mb-2">Comentario:</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {order.comment}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
