import { ClienteResponseDTO } from "./clienteresponse.dto";

export interface ContratoResponseDTO {
  idContrato: number;
  fechaContrato: Date;
  tipoContrato: string; // O el tipo de enum si lo mapeas
  montoTotal: number;
  inicial: number;
  saldo: number;
  cantidadLetras: number;
  observaciones: string;
  clientes: ClienteResponseDTO[];
}