import { LoteResponseDTO } from "./lote-response.dto";

export interface TransferenciaResponseDTO {
  idContratoOriginal: number;
  lotes: LoteResponseDTO[];
  idLotes: number[];
  idVendedor: number;
  nombreVendedor: string;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  letrasRestantes: number;
  letrasOriginales: number;
  resumen: string;
}