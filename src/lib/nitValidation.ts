/**
 * Utilidades de validación y formateo del NIT colombiano (DIAN).
 */

/** Solo dígitos */
const onlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Calcula el dígito de verificación (DV) del NIT según la fórmula DIAN.
 * @param nit NIT sin DV, solo dígitos
 */
export function calcularDV(nit: string): number {
  const clean = onlyDigits(nit);
  if (!clean) return 0;
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const reversed = clean.split("").reverse();
  let suma = 0;
  for (let i = 0; i < reversed.length; i++) {
    suma += parseInt(reversed[i], 10) * (pesos[i] ?? 0);
  }
  const mod = suma % 11;
  if (mod === 0 || mod === 1) return mod;
  return 11 - mod;
}

export interface NitParts {
  base: string;        // Solo dígitos (sin DV)
  dv: string | null;   // Dígito verificador si fue ingresado o calculable
  formatted: string;   // 900.123.456-7
  isValid: boolean;
  error?: string;
}

/**
 * Parsea un NIT con o sin DV.
 * Acepta formatos: 900123456, 900123456-7, 900.123.456-7, 900-123-456
 */
export function parseNit(input: string): NitParts {
  if (!input || !input.trim()) {
    return { base: "", dv: null, formatted: "", isValid: false, error: "NIT requerido" };
  }

  const trimmed = input.trim();
  let base = "";
  let dv: string | null = null;

  // Detectar DV separado por guion al final
  const guionMatch = trimmed.match(/^([\d.\s-]+?)-(\d)$/);
  if (guionMatch) {
    base = onlyDigits(guionMatch[1]);
    dv = guionMatch[2];
  } else {
    base = onlyDigits(trimmed);
  }

  // Validación: base debe tener entre 8 y 15 dígitos (NITs colombianos típicos)
  if (base.length < 8 || base.length > 15) {
    return {
      base,
      dv,
      formatted: formatBase(base) + (dv ? `-${dv}` : ""),
      isValid: false,
      error: "El NIT debe tener entre 8 y 15 dígitos",
    };
  }

  // Si se ingresó DV, validar que sea correcto
  if (dv !== null) {
    const dvCalculado = calcularDV(base);
    if (parseInt(dv, 10) !== dvCalculado) {
      return {
        base,
        dv,
        formatted: `${formatBase(base)}-${dv}`,
        isValid: false,
        error: `Dígito de verificación inválido (esperado: ${dvCalculado})`,
      };
    }
  } else {
    // Calcular DV automáticamente
    dv = String(calcularDV(base));
  }

  return {
    base,
    dv,
    formatted: `${formatBase(base)}-${dv}`,
    isValid: true,
  };
}

/** Formatea la base del NIT con puntos cada 3 dígitos: 900123456 -> 900.123.456 */
export function formatBase(base: string): string {
  const clean = onlyDigits(base);
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Detecta si un documento corresponde a un NIT (8+ dígitos) vs cédula. */
export function isLikelyNit(doc: string): boolean {
  const clean = onlyDigits(doc);
  return clean.length >= 9;
}
