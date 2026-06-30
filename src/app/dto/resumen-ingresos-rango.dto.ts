export type MedioPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'DEPOSITO'
  | 'YAPE'
  | 'PLIN'
  | 'CHEQUE'
  | null;

export interface ResumenIngresoItemDTO {
  tipoIngreso: 'LETRA' | 'MORA' | 'INICIAL' | 'INSCRIPCION_SERVICIO';
  idPago: number | null;
  numeroComprobante: string | null;
  fechaPago: any;          // puede venir como string ISO o array [y,m,d]
  importePagado: number;
  medioPago: MedioPago;
  numeroOperacion: string | null;
  referencia: string | null;
  idContrato: number | null;
  nombreCliente: string | null;
  observaciones: string | null;
  anulado?: boolean;
}

export interface ResumenIngresosRangoDTO {
  fechaDesde: any;
  fechaHasta: any;
  totalLetras: number;
  cantidadLetras: number;
  totalMoras: number;
  cantidadMoras: number;
  totalIniciales: number;
  cantidadIniciales: number;
  totalInscripcionesServicios: number;
  cantidadInscripcionesServicios: number;
  totalGeneral: number;
  cantidadTotal: number;
  detalle: ResumenIngresoItemDTO[];
}