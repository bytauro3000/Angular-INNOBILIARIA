export interface ResumenEgresoItemDTO {
  numeroEgreso: string;
  serie: string;
  numero: number;
  fechaEmision: any;
  concepto: string | null;
  beneficiario: string | null;
  idContrato: number | null;
  monto: number;
  moneda: 'USD' | 'PEN' | null;
  medioPago: string | null;
  numeroOperacion: string | null;
  fechaOperacion: string | null;
  usuarioRegistro: string | null;
}

export interface ResumenEgresosRangoDTO {
  fechaDesde: any;
  fechaHasta: any;
  totalUsd: number;
  totalPen: number;
  totalGeneral: number;
  cantidadTotal: number;
  detalle: ResumenEgresoItemDTO[];
}