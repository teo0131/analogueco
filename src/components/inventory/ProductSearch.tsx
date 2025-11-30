import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Scan, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Producto {
  id: string;
  nombre: string;
  codigo_barra?: string;
  unidad_inventario: string;
  stock_actual: number;
}

interface ProductSearchProps {
  onProductSelect: (producto: Producto) => void;
}

export const ProductSearch = ({ onProductSelect }: ProductSearchProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchValue.length >= 2) {
      searchProductos(searchValue);
    } else {
      setProductos([]);
    }
  }, [searchValue]);

  const searchProductos = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, codigo_barra, unidad_inventario, stock_actual')
        .or(`nombre.ilike.%${query}%,codigo_barra.ilike.%${query}%,codigo_interno.ilike.%${query}%`)
        .eq('es_activo', true)
        .limit(10);

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (producto: Producto) => {
    onProductSelect(producto);
    setSearchValue("");
    setProductos([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Si presionan Enter con un código escaneado
    if (e.key === 'Enter' && searchValue.length > 0) {
      // Buscar producto por código exacto
      const producto = productos.find(p => 
        p.codigo_barra?.toLowerCase() === searchValue.toLowerCase()
      );
      
      if (producto) {
        handleSelect(producto);
      } else if (productos.length === 1) {
        // Si solo hay un resultado, seleccionarlo
        handleSelect(productos[0]);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Escanea código de barras o busca por nombre..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setOpen(e.target.value.length >= 2);
                }}
                onKeyDown={handleBarcodeScan}
                className="pl-10"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0 bg-background z-50" align="start">
            <Command>
              <CommandList>
                {loading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Buscando productos...
                  </div>
                )}
                {!loading && productos.length === 0 && searchValue.length >= 2 && (
                  <CommandEmpty>No se encontraron productos</CommandEmpty>
                )}
                {!loading && productos.length > 0 && (
                  <CommandGroup heading="Productos encontrados">
                    {productos.map((producto) => (
                      <CommandItem
                        key={producto.id}
                        value={producto.id}
                        onSelect={() => handleSelect(producto)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{producto.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {producto.codigo_barra && `Código: ${producto.codigo_barra} • `}
                            Unidad: {producto.unidad_inventario} • Stock: {producto.stock_actual}
                          </div>
                        </div>
                        <Check className="h-4 w-4 opacity-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="h-4 w-4 mr-2" />
        Buscar
      </Button>
    </div>
  );
};
