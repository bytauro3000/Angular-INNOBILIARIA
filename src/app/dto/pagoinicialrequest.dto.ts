import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';
 
export interface PagoInicialRequestDTO {
  importePagado: number;
  fechaPago: string;                             // 'YYYY-MM-DD'
  medioPago?: MedioPago | null;
  numeroOperacion?: string | null;
  observaciones?: string | null;
  tipoComprobante?: TipoComprobante | null;
  numeroComprobantePersonalizado?: string | null;
}