import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

export interface PagoLetraRequest {
  idLetra: number;
  importePagado: number;
  medioPago: MedioPago;
  numeroOperacion?: string;
  /** @deprecated El backend ignora este valor, siempre usa LocalDate.now() */
  fechaPago?: string;
  /** Fecha del voucher (solo referencial, opcional) */
  fechaOperacion?: string;
  tipoComprobante?: TipoComprobante;
  numeroComprobantePersonalizado?: string;
  observaciones?: string;
  /** true = pago a cuenta (parcial); false/omitido = pago total */
  esPagoAcuenta?: boolean;
  /** Serie personalizada para el comprobante (ej: B001, EB01, F001) */
  seriePersonalizada?: string;
  /** PIN de autorización para pagos fuera de orden */
  pin?: string;
}