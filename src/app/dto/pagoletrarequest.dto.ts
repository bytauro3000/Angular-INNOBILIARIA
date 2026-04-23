import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

export interface PagoLetraRequest {
  idLetra: number;
  importePagado: number;
  medioPago: MedioPago;
  numeroOperacion?: string;
  fechaOperacion?: string;
  tipoComprobante?: TipoComprobante;
  numeroComprobantePersonalizado?: string;
  observaciones?: string;
}