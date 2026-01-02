// Sistema de conversión de unidades para inventario

export interface UnitInfo {
  name: string;
  symbol: string;
  baseUnit: string; // La unidad base a la que se convierte
  conversionToBase: number; // Factor de conversión a la unidad base
}

// Definición de unidades y sus conversiones
export const UNITS: Record<string, UnitInfo> = {
  // Masa
  kg: { name: "Kilogramo", symbol: "kg", baseUnit: "g", conversionToBase: 1000 },
  g: { name: "Gramos", symbol: "g", baseUnit: "g", conversionToBase: 1 },
  lb: { name: "Libra", symbol: "lb", baseUnit: "g", conversionToBase: 453.592 },
  oz: { name: "Onza", symbol: "oz", baseUnit: "g", conversionToBase: 28.3495 },
  // Volumen
  lt: { name: "Litros", symbol: "lt", baseUnit: "ml", conversionToBase: 1000 },
  ml: { name: "Mililitros", symbol: "ml", baseUnit: "ml", conversionToBase: 1 },
  // Unidades
  unidad: { name: "Unidad", symbol: "und", baseUnit: "unidad", conversionToBase: 1 },
};

// Grupos de unidades compatibles para conversión
export const UNIT_GROUPS: Record<string, string[]> = {
  masa: ["kg", "g", "lb", "oz"],
  volumen: ["lt", "ml"],
  unidad: ["unidad"],
};

// Obtener el grupo de una unidad
export function getUnitGroup(unit: string): string | null {
  for (const [group, units] of Object.entries(UNIT_GROUPS)) {
    if (units.includes(unit)) return group;
  }
  return null;
}

// Verificar si dos unidades son compatibles para conversión
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const group1 = getUnitGroup(unit1);
  const group2 = getUnitGroup(unit2);
  return group1 !== null && group1 === group2;
}

// Obtener unidades compatibles con una unidad dada
export function getCompatibleUnits(unit: string): string[] {
  const group = getUnitGroup(unit);
  if (!group) return [unit];
  return UNIT_GROUPS[group];
}

// Convertir cantidad de una unidad a otra
export function convertUnits(
  cantidad: number,
  fromUnit: string,
  toUnit: string
): number {
  if (fromUnit === toUnit) return cantidad;
  
  const fromInfo = UNITS[fromUnit];
  const toInfo = UNITS[toUnit];
  
  if (!fromInfo || !toInfo) {
    console.warn(`Unidad no reconocida: ${fromUnit} o ${toUnit}`);
    return cantidad;
  }
  
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    console.warn(`Unidades incompatibles: ${fromUnit} y ${toUnit}`);
    return cantidad;
  }
  
  // Convertir a unidad base y luego a unidad destino
  const valueInBase = cantidad * fromInfo.conversionToBase;
  const valueInTarget = valueInBase / toInfo.conversionToBase;
  
  return valueInTarget;
}

// Calcular costo por unidad base
export function calculateBaseCost(
  totalCost: number,
  cantidad: number,
  fromUnit: string,
  toUnit: string
): number {
  const convertedQuantity = convertUnits(cantidad, fromUnit, toUnit);
  if (convertedQuantity === 0) return 0;
  return totalCost / convertedQuantity;
}

// Formatear cantidad con unidad
export function formatQuantityWithUnit(cantidad: number, unit: string): string {
  const unitInfo = UNITS[unit];
  const symbol = unitInfo?.symbol || unit;
  
  // Formatear con decimales apropiados
  const formatted = cantidad % 1 === 0 
    ? cantidad.toString() 
    : cantidad.toFixed(2);
  
  return `${formatted} ${symbol}`;
}

// Obtener opciones de unidad de entrada para un insumo
export function getEntryUnitOptions(baseUnit: string): Array<{ value: string; label: string }> {
  const compatibleUnits = getCompatibleUnits(baseUnit);
  return compatibleUnits.map(unit => ({
    value: unit,
    label: UNITS[unit]?.name || unit,
  }));
}
