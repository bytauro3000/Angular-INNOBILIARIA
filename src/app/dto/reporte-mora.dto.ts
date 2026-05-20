export interface FilaClienteMora {
  nombreClientes: string;
  manzanas: string[];
  numeroLotes: string[];
  cantidadLetrasAtrasadas: number;
  rangoLetras: string;
  importeTotal: number;
  moneda: string;
  celular: string;
  idContrato: number;
  nombrePrograma: string;
  fechaVencimientoInicio: string;
}
 
export interface ReporteClientesMoraDTO {
  nombrePrograma: string;
  clientes: FilaClienteMora[];
}
 