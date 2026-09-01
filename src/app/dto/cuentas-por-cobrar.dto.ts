export interface CuentasPorCobrarDTO {
  totalUsd: number;
  totalPen: number;
  programas: GrupoProgramaDTO[];
}

export interface GrupoProgramaDTO {
  nombrePrograma: string;
  totalUsd: number;
  totalPen: number;
  contratos: FilaCuentaDTO[];
}

export interface FilaCuentaDTO {
  idContrato: number;
  nombreCliente: string;
  manzanas: string[];
  numeroLotes: string[];
  nombrePrograma: string;
  moneda: string;
  cantidadLetras: number;
  montoPorCobrar: number;
  montoPagado: number;
  proximaVencimiento: string;
}