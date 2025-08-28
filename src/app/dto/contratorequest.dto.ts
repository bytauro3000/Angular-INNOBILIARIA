import { Contrato } from '../models/contrato.model';


export interface ContratoRequestDTO {
  contrato: Contrato;
  idClientes: number[];
  idLotes: number[];
  idSeparacion?: number; // Opcional
}