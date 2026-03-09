import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

export interface PagoLetraResponse {
  idPago?: number;
  idLetra?: number;
  numeroLetra?: string;
  fechaPago?: Date;
  importePagado?: number;
  medioPago?: string;
  numeroOperacion?: string;
  fechaOperacion?: Date;
  tipoComprobante?: string;
  numeroComprobante?: string;
  observaciones?: string;
  urlsVoucher: string[];  // 👈 nuevo
}
