import { Vendedor } from "./vendedor.model";
import { Separacion } from "./separacion.model";
import { Usuario } from "./usuario.model";
import { TipoContrato } from "../enums/tipocontrato.enum";
import { ContratoCliente } from "./contrato-cliente.model";
import { ContratoLote } from "./contrato-lote.model";
import { LetraCambio } from "./letra-cambio.model";

export interface Contrato {
  idContrato?: number;
  separacion?: Separacion;
  vendedor?: Vendedor;
  usuario: Usuario;
  tipoContrato: TipoContrato;
  fechaContrato: string; // Usamos 'string' para fechas desde la API
  montoTotal: number;
  inicial?: number;
  saldo?: number;
  cantidadLetras?: number;
  observaciones?: string;
  
  // Relaciones, representadas como arreglos de las interfaces correspondientes
  letrasCambio?: LetraCambio[];
  clientes?: ContratoCliente[];
  lotes?: ContratoLote[];
}
