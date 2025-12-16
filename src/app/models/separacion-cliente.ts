import { Separacion } from './separacion.model';
import { Cliente } from './cliente.model';
import {TipoPropietario} from '../enums/tipopropietario.enum'
import { SeparacionClienteId } from './separacion-cliente-id';

export interface SeparacionCliente {
  id: SeparacionClienteId;
  separacion: Separacion;
  cliente: Cliente;
  tipoPropietario: TipoPropietario;
}