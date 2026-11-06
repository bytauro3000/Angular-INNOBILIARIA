export interface IngresoDetalladoItemDTO {
  idComprobante: number;
  numeroCompleto: string;
  tipoComprobante: 'BOLETA' | 'RECIBO';
  fechaEmision: any;
  monto: number;
  moneda: 'USD' | 'PEN' | 'N/D';
  dni: string | null;
  receptor: string;
  estado: 'VIGENTE' | 'ANULADO_NC' | 'ANULADO_PAGO';
  ncNumeroCompleto: string | null;
  ncFechaEmision: any;
}

export interface TotalesMonedaDTO {
  moneda: string;
  bruto: number;
  anulada: number;
  neto: number;
}

export interface ReporteIngresosDetalladoDTO {
  fechaDesde: any;
  fechaHasta: any;
  tipoFiltro: 'TODOS' | 'BOLETA' | 'RECIBO';
  cantidadTotal: number;
  cantidadAnuladas: number;
  totales: TotalesMonedaDTO[];
  detalle: IngresoDetalladoItemDTO[];
}
