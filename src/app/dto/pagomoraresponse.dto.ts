import { MedioPago } from '../enums/mediopago.enum';
import { TipoComprobante } from '../enums/tipocomprobante';

export interface PagoMoraResponse {
  idPagoMora: number;   
  idMora: number;
  montoPagado: number;
  fechaPago: string;
  medioPago: string;
  numeroOperacion: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
  observaciones: string | null;
}
 