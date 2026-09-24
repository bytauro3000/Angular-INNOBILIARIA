import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';
 
export interface PagoInicialRequestDTO {
  importePagado: number;
  fechaPago: string;                             // 'YYYY-MM-DD'
  fechaOperacion?: string;                       // 'YYYY-MM-DD' — fecha del voucher
  horaOperacion?: string | null;                 // 'HH:mm:ss' — hora exacta del voucher (OCR)
  medioPago?: MedioPago | null;
  numeroOperacion?: string | null;
  observaciones?: string | null;
  tipoComprobante?: TipoComprobante | null;
  numeroComprobantePersonalizado?: string | null;
}