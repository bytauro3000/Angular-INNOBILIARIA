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
  saldoPendiente?: number;
  estadoLetra?: string;
  esPagoAcuenta?: boolean;
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