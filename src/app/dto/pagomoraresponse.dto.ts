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
  /** Descuento negociado proporcional aplicado a este pago. */
  descuentoAplicado?: number;
  /** Saldo restante de la mora después de este pago. */
  saldoRestante?: number;
  sunatAceptado?: boolean;
  sunatMensaje?: string;
  sunatAdvertencia?: string;
  estadoSunat?: string;
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