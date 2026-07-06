/**
 * Réplica EXACTA de la fórmula de cálculo de mora del backend.
 * Fuente: MoraServiceImpl.java (constantes PORCENTAJE_MORA=0.05, MONTO_DIARIO=1.00)
 *         líneas 70-73, 100-105, 362-364.
 *
 * Reglas:
 *   - montoPorcentaje = round(importeLetra * 0.05, 2, HALF_UP)
 *   - montoDiario     = round(1.00        * diasMora, 2, HALF_UP)
 *   - montoMoraTotal  = montoPorcentaje + montoDiario (sin redondeo extra: ambos a 2 decimales)
 *   - diasMora        = ChronoUnit.DAYS.between(fechaVenc, fechaRef)  (en días calendario)
 *
 * HALF_UP: 0.5 redondea hacia arriba (alejándose de cero).
 */

export const PORCENTAJE_MORA = 0.05;
export const MONTO_DIARIO    = 1.00;

/** Redondea a 2 decimales con HALF_UP (replica Java BigDecimal.setScale(2, HALF_UP)) */
/** Si el vencimiento cae domingo, se traslada al lunes (día de gracia). */
export function aplicarGraciaDominical(fecha: string | Date): Date {
  const d = (typeof fecha === 'string') ? new Date(fecha + 'T00:00:00') : new Date(fecha);
  if (d.getDay() !== 0) return d;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

export function round2HalfUp(value: number): number {
  if (!isFinite(value)) return 0;
  // Truco equivalente a toFixed pero sin toString:
  // 1) Multiplicar por 100, 2) Math.round (HALF_UP en IEEE-754 con +0.5),
  // 3) Dividir por 100.
  // Math.round de JS usa "round half to positive infinity" — para +0.5
  // coincide con HALF_UP. Para -0.5 difiere (JS redondea a 0; HALF_UP a -1).
  // Como los importes son siempre >= 0, es seguro.
  return Math.round(value * 100) / 100;
}

/** Días calendario entre dos fechas (YYYY-MM-DD o ISO). Réplica de ChronoUnit.DAYS.between. */
export function diasCalendario(fechaVenc: string | Date, fechaRef: string | Date): number {
  const a = (typeof fechaVenc === 'string') ? new Date(fechaVenc + 'T00:00:00') : fechaVenc;
  const b = (typeof fechaRef  === 'string') ? new Date(fechaRef  + 'T00:00:00') : fechaRef;
  // Normalizar a midnight para evitar drift por horas/minutos.
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const ms = b0.getTime() - a0.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export interface MoraCalculada {
  diasMora:        number;
  montoPorcentaje: number;
  montoDiario:     number;
  montoMoraTotal:  number;
}

/**
 * Calcula la mora para una letra vencida.
 * @param importeLetra  Importe de la letra (positivo)
 * @param fechaVencimiento  Fecha de vencimiento (ISO o Date)
 * @param fechaReferencia   Fecha de referencia para el cálculo (default: hoy)
 */
export function calcularMora(
  importeLetra: number,
  fechaVencimiento: string | Date,
  fechaReferencia?: string | Date
): MoraCalculada {
  const ref  = fechaReferencia ?? new Date();
  const fechaVencEfectiva = aplicarGraciaDominical(fechaVencimiento);

  if (diasCalendario(fechaVencEfectiva, ref) <= 0) {
    return { diasMora: 0, montoPorcentaje: 0, montoDiario: 0, montoMoraTotal: 0 };
  }

  const dias = diasCalendario(fechaVencimiento, ref);

  const montoPct  = round2HalfUp(importeLetra * PORCENTAJE_MORA);
  const montoDiar = round2HalfUp(MONTO_DIARIO * dias);
  const total     = round2HalfUp(montoPct + montoDiar);

  return {
    diasMora:        dias,
    montoPorcentaje: montoPct,
    montoDiario:     montoDiar,
    montoMoraTotal:  total
  };
}
