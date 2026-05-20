import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

export interface PagoLetraResponse {
  idPago: number;
  idLetra?: number;
  numeroLetra?: string;
  fechaPago?: string;
  importePagado?: number;
  medioPago?: string;
  numeroOperacion?: string;
  tipoComprobante?: string;
  numeroComprobante?: string;
  idComprobante?: number;
  observaciones?: string;
  urlsVoucher: string[];
  /** Saldo que quedó pendiente si fue un pago a cuenta */
  saldoPendiente?: number;
  /** Estado resultante de la letra luego del pago (PAGADO | PARCIAL) */
  estadoLetra?: string;
  /** Indica si este registro fue un pago a cuenta */
  esPagoAcuenta?: boolean;
}