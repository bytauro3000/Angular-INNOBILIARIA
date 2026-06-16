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
  idComprobante: number | null;
  observaciones: string | null;
  urlsVoucher: string[];
  sunatAceptado?: boolean;
  sunatMensaje?: string;
  anulado?: boolean;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  anuladoPor?: string;
  // Contexto admin
  idContrato?: number;
  manzana?: string;
  numeroLote?: string;
  idPrograma?: number;
  nombrePrograma?: string;
  nombreCliente?: string;
  moneda?: 'USD' | 'PEN';
}