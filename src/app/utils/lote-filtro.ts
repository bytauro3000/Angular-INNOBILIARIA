import { Lote } from '../models/lote.model';

/**
 * Normaliza un término de búsqueda: minúsculas, colapsa espacios y tolera
 * separadores como "-", "/", ".", "," entre la manzana y el número de lote.
 * Ej: "B1 14", "b1-14", "B1/14" → "b1 14".
 */
export function normalizarTerminoLote(termino: string): string {
  return termino
    .trim()
    .toLowerCase()
    .replace(/[\s\-/.,]+/g, ' ')
    .trim();
}

/**
 * Determina si un lote coincide con el término de búsqueda.
 *
 * Soporta:
 *  - "B1"    → filtra por manzana (todos los lotes de esa MZ).
 *  - "14"    → filtra por número de lote (prefijo numérico: 14, 140…).
 *  - "B1 14" → filtra el lote EXACTO 14 de la manzana B1 (no el 141).
 *  - "B1 1"  → filtra el lote EXACTO 1 de la manzana B1 (no 14, 15, 19…).
 *
 * La manzana siempre coincide en forma exacta; el lote coincide exacto cuando
 * se escribe MZ + lote, y por prefijo numérico cuando se escribe solo un número.
 */
export function loteCoincide(lote: Lote, termino: string): boolean {
  const term = normalizarTerminoLote(termino);
  if (!term) return true;

  const mz = (lote.manzana || '').trim().toLowerCase();
  const lt = (lote.numeroLote || '').trim().toLowerCase();

  // "mz lt" como texto plano para una coincidencia parcial directa
  const claveCompleta = `${mz} ${lt}`;
  if (claveCompleta.includes(term)) return true;

  const partes = term.split(' ').filter(p => p.length > 0);

  // Solo número → filtrar por prefijo del lote (extrae dígitos)
  if (partes.length === 1) {
    const solo = partes[0];
    if (/^\d+$/.test(solo)) {
      const digitos = extraerDigitos(lt);
      return digitos.startsWith(solo);
    }
    // Solo texto → coincidir con la manzana
    return mz.includes(solo);
  }

  // Dos partes (MZ + lote): manzana exacta y lote EXACTO
  const mzBusqueda = partes[0];
  const ltBusqueda = partes.slice(1).join('');

  if (mz !== mzBusqueda) return false;

  if (/^\d+$/.test(ltBusqueda)) {
    return extraerDigitos(lt) === ltBusqueda;
  }
  return lt === ltBusqueda;
}

function extraerDigitos(valor: string): string {
  return (valor || '').replace(/\D/g, '');
}