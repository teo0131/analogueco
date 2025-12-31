import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url?: string;
}

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
      className="h-auto flex-col items-start p-2 hover:bg-primary/10 hover:border-primary transition-all group w-full min-h-0"
    >
      <div className="w-full flex justify-between items-start">
        <h3 className="font-semibold text-left text-sm group-hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
        <Plus className="h-4 w-4 flex-shrink-0 ml-1 group-hover:text-primary transition-colors" />
      </div>
      <p className="text-base font-bold text-primary">{formatPrice(item.price)}</p>
    </Button>
  );
};

export type { MenuItem };
