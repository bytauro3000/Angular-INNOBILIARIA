export interface FilaClienteMora {
  nombreClientes: string;
  manzanas: string[];
  numeroLotes: string[];
  areas: number[];
  cantidadLetrasAtrasadas: number;
  rangoLetras: string;
  importeTotal: number;
  moneda: string;
  celular: string;
  celulares: string[];
  idContrato: number;
  nombrePrograma: string;
  fechaVencimientoInicio: string;
}
 
export interface ReporteClientesMoraDTO {
  nombrePrograma: string;
  clientes: FilaClienteMora[];
}

export interface DetalleLetraVencida {
  numeroLetra: string;
  importe: number;
  fechaVencimiento: string;
  diasMora: number;
  montoMora: number;
  venceHoy: boolean;
  estado: string;
  nombreEmpresa: string;
}
 