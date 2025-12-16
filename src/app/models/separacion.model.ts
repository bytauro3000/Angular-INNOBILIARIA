import { Vendedor } from "./vendedor.model";
import { EstadoSeparacion } from "../enums/estadoseparacion.enum";
import { SeparacionCliente } from "./separacion-cliente";
import { SeparacionLote } from "./separacion-lote";

export interface Separacion {
  idSeparacion?: number;
  vendedor?: Vendedor;
  monto: number;
  fechaSeparacion: string;
  fechaLimite: string;
  estado?: EstadoSeparacion;
  observaciones?: string;
  

  clientes: SeparacionCliente[];
  lotes: SeparacionLote[];
}