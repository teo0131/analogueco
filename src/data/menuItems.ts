export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export const menuItems: MenuItem[] = [
  // Croissants
  { id: "croissant-almendras", name: "Croissant de Almendras", price: 5900, description: "Hojaldre artesanal relleno de crema de almendras", category: "Croissants" },
  { id: "croissant-chocolate", name: "Croissant de Chocolate", price: 5900, description: "Croissant artesanal con chocolate", category: "Croissants" },
  { id: "croissant-queso", name: "Croissant de Queso", price: 4000, description: "Hojaldre con relleno cremoso de queso", category: "Croissants" },
  { id: "croissant-sencillo", name: "Croissant Sencillo", price: 3500, description: "Croissant artesanal tradicional", category: "Croissants" },
  
  // Panadería Dulce
  { id: "pastel-arequipe", name: "Pastel de Arequipe y Queso", price: 5000, description: "Dulce de leche con queso en masa hojaldrada", category: "Panadería Dulce" },
  { id: "pastel-guayaba", name: "Pastel de Guayaba", price: 4500, description: "Delicioso pastel con guayaba", category: "Panadería Dulce" },
  { id: "pastel-gloria", name: "Pastel Gloria", price: 4500, description: "Pastel especial de la casa", category: "Panadería Dulce" },
  
  // Panadería Salada
  { id: "palo-queso", name: "Palo de Queso", price: 3500, description: "Tradicional palo de queso", category: "Panadería Salada" },
  { id: "tres-quesos", name: "3 Quesos", price: 5900, description: "Deliciosa mezcla de tres quesos", category: "Panadería Salada" },
  { id: "ranchero", name: "Ranchero", price: 4500, description: "Relleno ranchero especial", category: "Panadería Salada" },
  { id: "hawaiano", name: "Hawaiano", price: 4500, description: "Jamón y piña", category: "Panadería Salada" },
  { id: "pollo-champinones", name: "Pollo Champiñones", price: 5900, description: "Relleno de pollo en salsa con champiñones", category: "Panadería Salada" },
  { id: "carne-desmechada", name: "Carne Desmechada", price: 5900, description: "Carne desmechada colombiana", category: "Panadería Salada" },
  { id: "italiano", name: "Italiano", price: 4500, description: "Sabores italianos", category: "Panadería Salada" },
  
  // Bebidas Calientes
  { id: "espresso", name: "Espresso", price: 4000, description: "Café especial de Ciudad Bolívar en máquina italiana", category: "Bebidas Calientes" },
  { id: "americano", name: "Americano", price: 4500, description: "Espresso alargado con agua caliente", category: "Bebidas Calientes" },
  { id: "cappuccino", name: "Cappuccino", price: 5000, description: "Espresso con leche vaporizada y espuma cremosa", category: "Bebidas Calientes" },
  { id: "cafe-latte", name: "Café Latte", price: 3500, description: "Espresso suave con abundante leche vaporizada", category: "Bebidas Calientes" },
  { id: "aromaticas", name: "Aromáticas", price: 2000, description: "Infusiones naturales", category: "Bebidas Calientes" },
  { id: "aromaticas-valles", name: "Aromáticas Los Valles", price: 4000, description: "Aromáticas premium de Los Valles", category: "Bebidas Calientes" },
  { id: "milo", name: "Milo", price: 5000, description: "Bebida de chocolate con malta", category: "Bebidas Calientes" },
  
  // Bebidas Frías
  { id: "agua", name: "Agua", price: 2000, description: "Agua embotellada", category: "Bebidas Frías" },
  { id: "cold-brew", name: "Cold Brew", price: 5000, description: "Café de extracción en frío, suave y refrescante", category: "Bebidas Frías" },
  { id: "cervezas", name: "Cervezas Nacionales", price: 4500, description: "Selección de cervezas colombianas", category: "Bebidas Frías" },
  { id: "gaseosas-postobon", name: "Gaseosas Postobón", price: 2500, description: "Variedad de sabores Postobón", category: "Bebidas Frías" },
  { id: "gaseosas-coca", name: "Gaseosas Coca Cola", price: 2500, description: "Productos Coca Cola", category: "Bebidas Frías" },
  { id: "pony-malta", name: "Pony Malta", price: 3800, description: "Bebida de malta", category: "Bebidas Frías" },
  
  // Helados
  { id: "helado-tradicional", name: "Helado Popsy Tradicional", price: 6500, description: "Helados Popsy sabores tradicionales", category: "Helados Popsy" },
  { id: "helado-exclusivo", name: "Helado Popsy Exclusivo", price: 8000, description: "Helados Popsy sabores exclusivos", category: "Helados Popsy" },
];

export const categories = Array.from(new Set(menuItems.map(item => item.category)));
