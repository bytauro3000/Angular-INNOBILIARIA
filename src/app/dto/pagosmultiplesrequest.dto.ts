import { PagoLetraRequest } from './pagoletrarequest.dto';


export interface PagosMultiplesRequest {
  pagos: PagoLetraRequest[];
  /** Monto de descuento negociado a prorratear entre las letras (opcional) */
  descuentoNegociado?: number;
  /** Motivo del descuento (obligatorio si descuentoNegociado > 0) */
  motivoDescuento?: string;
  /** ID de la letra que se otorga como gratis (opcional) */
  idLetraGratis?: number;
  /** Motivo de la letra gratis (obligatorio si idLetraGratis está presente) */
  motivoLetraGratis?: string;
}