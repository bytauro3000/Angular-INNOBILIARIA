export interface PagoInicialResponseDTO {
  idPagoInicial: number;
  importePagado: number;
  fechaPago: string;
  medioPago?: string;
  numeroOperacion?: string;
  observaciones?: string;
  urlsVoucher?: string[];
  idComprobante?: number;
  tipoComprobante?: string;
  numeroComprobante?: string;
  anulado?: boolean;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  anuladoPor?: string;
  // Contexto admin
  idContrato?: number;
  nombreCliente?: string;
  manzana?: string;
  numeroLote?: string;
  nombrePrograma?: string;
  moneda?: 'USD' | 'PEN';
}