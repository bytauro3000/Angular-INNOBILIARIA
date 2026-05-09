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
}