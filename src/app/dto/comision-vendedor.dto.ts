export interface ComisionVendedorDTO {
  idComision: number;
  idContrato: number;
  idVendedor: number;
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
  fechaContrato: string;
  pagosMensualesPendientes: number;
  nivelColor: string;
  pagosMensualesRegistrados: number;
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

export interface PagoComisionRequest {
  tipo: 'ADELANTO' | 'MENSUAL';
  idComision?: number;
  idLetras?: number[];
  monto?: number;
  medioPago?: string;
  numeroOperacion?: string;
  fechaOperacion?: string;
  /** Hora exacta del voucher (HH:mm:ss), solo si la fecha de operación viene del OCR */
  horaOperacion?: string;
  fechaPago?: string;
  observacion?: string;
}

export interface PagoComisionResponse {
  numerosEgreso: string[];
  idsComision: number[];
  saldoPendiente: number | null;
  estado: string;
  fechaPago: string;
  urlsVoucher: string[];
  conceptoDetalle: string;
}

export interface ReportePagosVendedorDTO {
  idVendedor: number | null;
  todosVendedores: boolean;
  filtroTipo: string;
  nombreVendedor: string;
  apellidosVendedor: string;
  dniVendedor: string | null;
  totalPagos: number;
  totalAdelantos: number;
  totalMensuales: number;
  totalGeneral: number;
  moneda: string;
  fechaEmision: string;
  pagos: FilaPagoVendedor[];
}

export interface FilaPagoVendedor {
  numero: number;
  idVendedor: number | null;
  nombreVendedor: string;
  tipo: string;
  fechaPago: string;
  numeroLetra: string | null;
  idContrato: number | null;
  manzana: string;
  numeroLote: string;
  programa: string;
  monto: number;
  medioPago: string | null;
  numeroOperacion: string | null;
  numeroEgreso: string | null;
  moneda: string;
}