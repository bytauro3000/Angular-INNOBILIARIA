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
}