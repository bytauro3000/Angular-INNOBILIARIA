import { EstadoSeparacion } from "../enums/estadoseparacion.enum";

export interface SeparacionResumen {
  idSeparacion: number;
  monto: number;
  fechaSepara: string;
  fechaLimite: string;
  estadoSeparacion: EstadoSeparacion;
  nomVendedor: string;
  clientes: { nombreCompleto: string; numDoc: string }[];
  lotes: { manzana: string; numeroLote: string }[];
}