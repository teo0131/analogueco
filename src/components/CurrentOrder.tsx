import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, ShoppingCart, Banknote } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

interface CurrentOrderProps {
  items: MenuItem[];
  comment: string;
  onCommentChange: (comment: string) => void;
  onRemoveItem: (index: number) => void;
  onCompleteOrder: () => void;
  onSendToActive?: () => void;
  orderNumber: number;
  isCompleting?: boolean;
}

// Colombian bill denominations
const BILL_DENOMINATIONS = [
  { value: 100000, label: "$100.000" },
  { value: 50000, label: "$50.000" },
  { value: 20000, label: "$20.000" },
  { value: 10000, label: "$10.000" },
  { value: 5000, label: "$5.000" },
  { value: 2000, label: "$2.000" },
  { value: 1000, label: "$1.000" },
];

export const CurrentOrder = ({
  items,
  comment,
  onCommentChange,
  onRemoveItem,
  onCompleteOrder,
  onSendToActive,
  orderNumber,
  isCompleting = false,
}: CurrentOrderProps) => {
  const [selectedBill, setSelectedBill] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const change = selectedBill !== null && selectedBill >= total ? selectedBill - total : null;

  const handleBillClick = (billValue: number) => {
    if (billValue >= total) {
      setSelectedBill(billValue);
    }
  };

  const clearSelection = () => {
    setSelectedBill(null);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Orden #{orderNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Selecciona items del menú para comenzar
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex justify-between items-center p-2 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{formatPrice(item.price)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(index)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Bill denominations for quick change calculation */}
            <div className="mb-4">
              <Label className="flex items-center gap-1 mb-2 text-sm text-muted-foreground">
                <Banknote className="h-4 w-4" />
                Paga con:
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {BILL_DENOMINATIONS.map((bill) => {
                  const isDisabled = bill.value < total;
                  const isSelected = selectedBill === bill.value;
                  return (
                    <Button
                      key={bill.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleBillClick(bill.value)}
                      disabled={isDisabled}
                      className={`text-xs font-medium ${
                        isDisabled ? "opacity-50" : ""
                      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      {bill.label}
                    </Button>
                  );
                })}
                {selectedBill !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs text-muted-foreground"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Change display */}
            {change !== null && (
              <div className="mb-4 p-3 rounded-lg bg-accent/20 border border-accent">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recibe:</span>
                  <span className="font-bold">{formatPrice(selectedBill!)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-accent-foreground">Devuelta:</span>
                  <span className="text-lg font-bold text-accent-foreground">
                    {formatPrice(change)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <Label htmlFor="comment">Comentario de la orden</Label>
              <Textarea
                id="comment"
                placeholder="Notas sobre la orden..."
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onCompleteOrder}
                className="flex-1 bg-accent hover:bg-accent/90"
                size="lg"
                disabled={isCompleting}
              >
                {isCompleting ? "Guardando..." : "Completar Orden"}
              </Button>
              {onSendToActive && (
                <Button
                  onClick={onSendToActive}
                  variant="outline"
                  size="lg"
                  disabled={isCompleting}
                  className="flex-1"
                >
                  Todavía Activa
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
