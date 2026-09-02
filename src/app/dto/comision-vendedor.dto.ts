export interface ComisionVendedorDTO {
  idComision: number;
  idContrato: number;
  nombreVendedor: string;
  nombreCliente: string;
  programa: string;
  manzanas: string;
  numeroLotes: string;
  porcentajeComision: number;
  montoTotalContrato: number;
  montoComisionTotal: number;
  moneda: string;
  montoAdelanto: number | null;
  saldoPendiente: number;
  estado: string;
  adelantoHabilitado: boolean;
  montoAdelantoSugerido: number;
  cantidadLetrasPagadas: number;
  fechaCreacion: string;
}

export interface PagoComisionMensualDTO {
  idLetra: number;
  numeroLetra: string;
  fechaVencimiento: string;
  importeLetra: number;
  montoComision: number;
  ultimoPago: boolean;
  seleccionado: boolean;
}

export interface PagoComisionResultadoDTO {
  numerosEgreso: string[];
  idComision: number;
  saldoPendiente: number;
  estado: string;
  fechaPago: string;
}

export interface RegistrarAdelantoRequest {
  idComision: number;
  monto?: number;
  observacion?: string;
}

export interface RegistrarPagosMensualesRequest {
  idComision: number;
  idLetras: number[];
  observacion?: string;
}