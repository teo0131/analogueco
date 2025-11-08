import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MenuItem } from "@/data/menuItems";

interface MenuItemButtonProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export const MenuItemButton = ({ item, onAdd }: MenuItemButtonProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Button
      variant="outline"
      onClick={() => onAdd(item)}
      className="h-auto flex-col items-start p-4 hover:bg-primary/10 hover:border-primary transition-all group"
    >
      <div className="w-full flex justify-between items-start mb-2">
        <h3 className="font-semibold text-left group-hover:text-primary transition-colors">{item.name}</h3>
        <Plus className="h-5 w-5 flex-shrink-0 ml-2 group-hover:text-primary transition-colors" />
      </div>
      <p className="text-sm text-muted-foreground text-left mb-2">{item.description}</p>
      <p className="text-lg font-bold text-primary">{formatPrice(item.price)}</p>
    </Button>
  );
};
