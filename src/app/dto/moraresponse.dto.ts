import { PagoMoraResponse } from "./pagomoraresponse.dto";

export type EstadoMora = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export interface MoraResponse {
  idMora: number;
  idLetra: number;
  numeroLetra: string;
  importeLetra: number;
  fechaVencimientoLetra: string;
  idPagoLetra: number | null;
  diasMora: number;
  porcentajeAplicado: number;
  montoPorcentaje: number;
  montoDiario: number;
  montoMoraTotal: number;
  fechaGeneracion: string;
  estadoMora: EstadoMora;
  pagos: PagoMoraResponse[];
}