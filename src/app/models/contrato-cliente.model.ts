import { Contrato } from './contrato.model';
import { Cliente } from './cliente.model';
import {TipoPropietario} from '../enums/tipopropietario.enum'
import { ContratoClienteId } from './contrato-cliente-id.model';

export interface ContratoCliente {
  id: ContratoClienteId;
  contrato: Contrato;
  cliente: Cliente;
  tipoPropietario: TipoPropietario;
}
