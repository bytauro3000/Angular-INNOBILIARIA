import { MedioPago } from '../enums/mediopago.enum';
import { TipoComprobante } from '../enums/tipocomprobante';

export interface MoraPagoItem {
  idMora: number;
  /** Monto a pagar de esta mora (≤ saldo pendiente; permite pago parcial). */
  importePagado: number;
}

export interface MoraPagosMultiplesRequest {
  pagos: MoraPagoItem[];
  /** Monto de descuento negociado a prorratear entre las moras (opcional). */
  descuentoNegociado?: number;
  /** Motivo del descuento (obligatorio si descuentoNegociado > 0). */
  motivoDescuento?: string;
  fechaPago: string;
  fechaOperacion?: string;
  horaOperacion?: string;
  medioPago: MedioPago;
  numeroOperacion?: string;
  tipoComprobante?: TipoComprobante;
  numeroComprobantePersonalizado?: string;
  observaciones?: string;
}

export interface MoraPagosMultiplesResponse {
  pagos: any[];
  numeroComprobanteGenerado: string | null;
  descuentoAplicado: number;
  montoTotalNeto: number;
}
