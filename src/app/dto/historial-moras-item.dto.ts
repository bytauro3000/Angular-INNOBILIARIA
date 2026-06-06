/**
 * Item unificado para el reporte "HISTORIAL DE MORAS".
 * Se construye a partir de:
 *   - Bloque A: MoraResponse[] (registradas en BD)
 *   - Bloque B: LetraCambio[] (vencidas sin mora registrada, calculadas en vivo)
 *
 * Orden de presentación:
 *   1. Bloque A primero (orden natural por numeroLetra)
 *   2. Bloque B después (orden natural por numeroLetra)
 *   3. TOTAL MORA al final
 */

export type BloqueOrigen = 'REGISTRADA' | 'PENDIENTE';

export interface HistorialMorasItem {
  /** 'REGISTRADA' o 'PENDIENTE' (calculada en vivo) */
  bloque: BloqueOrigen;

  /** Número de la letra que origina la mora (ej: "5", "12") */
  numeroLetra: string;

  /** Fecha de vencimiento de la letra (YYYY-MM-DD) */
  fechaVencimiento: string;

  /** Fecha de pago de la mora (solo bloque A) */
  fechaPago: string | null;

  /** Días de atraso */
  diasMora: number;

  /** 5% del importe de la letra */
  montoPorcentaje: number;

  /** S/ 1.00 × días */
  montoDiario: number;

  /** Total: montoPorcentaje + montoDiario */
  montoMoraTotal: number;

  /** Para el footer: total acumulado */
  tipoComprobante: string | null;
  numeroComprobante: string | null;

  /** Si la mora está anulada o sus pagos están anulados (tachada, no suma) */
  anulada: boolean;

  /** idMora original (null si es pendiente calculada) */
  idMora: number | null;
}
