import { Button } from "@/components/ui/button";
import { Plus, ImageIcon } from "lucide-react";

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
      className="h-auto flex-col items-start p-3 hover:bg-primary/10 hover:border-primary transition-all group w-full"
    >
      {/* Image */}
      <div className="w-full aspect-square mb-2 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      
      <div className="w-full flex justify-between items-start mb-1">
        <h3 className="font-semibold text-left text-sm group-hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
        <Plus className="h-4 w-4 flex-shrink-0 ml-1 group-hover:text-primary transition-colors" />
      </div>
      <p className="text-lg font-bold text-primary">{formatPrice(item.price)}</p>
    </Button>
  );
};

export type { MenuItem };
