import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

export interface PagoLetraResponse {
  idPago: number;
  idLetra: number;
  numeroLetra: string;
  fechaPago: string;  
  importePagado: number;
  medioPago: MedioPago;
  numeroOperacion?: string;
  fechaOperacion?: string;
  urlVoucher?: string;
  tipoComprobante?: TipoComprobante;
  numeroComprobante?: string;
  observaciones?: string;
}