import { Contrato } from '../models/contrato.model';


export interface ContratoRequest {
  contrato: Contrato;
  idClientes: number[];
  idLotes: number[];
  idSeparacion?: number; // Opcional
}