import { MedioPago } from '../enums/mediopago.enum';
import { TipoComprobante } from '../enums/tipocomprobante';
 
export interface PagoMoraRequest {
  idMora: number;
  montoPagado: number;
  fechaPago: string;
  medioPago: MedioPago;
  numeroOperacion?: string;
  tipoComprobante?: TipoComprobante;
  numeroComprobantePersonalizado?: string;
  observaciones?: string;
}