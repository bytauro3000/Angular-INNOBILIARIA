export interface ContratoRequestDTO {
  fechaContrato: string;
  tipoContrato: string;
  montoTotal: number;
  inicial: number;
  saldo: number;
  cantidadLetras: number;
  observaciones?: string;
  idVendedor?: number;
  idUsuario?: number;
  idSeparacion?: number;
  idClientes: number[];
  idLotes: number[];

  
}
