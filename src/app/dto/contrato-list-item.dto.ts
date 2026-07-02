import { EstadoContrato } from '../enums/Estadocontrato.enum';
import { Moneda } from './moneda.enum';
import { TipoContrato } from '../enums/tipocontrato.enum';

export interface ContratoListItemDTO {
  idContrato: number;
  fechaContrato: string;
  tipoContrato: TipoContrato;
  estadoContrato: EstadoContrato;
  montoTotal: number;
  inicial: number;
  saldo: number;
  cantidadLetras: number;
  moneda: Moneda;
  clientes: ClienteSimpleDTO[];
  lotes: LoteSimpleDTO[];
  tieneLetras: boolean;
}

export interface ClienteSimpleDTO {
  nombre: string;
  apellidos: string;
  numDoc: string;
}

export interface LoteSimpleDTO {
  manzana: string;
  numeroLote: string;
  nombrePrograma: string;
}
