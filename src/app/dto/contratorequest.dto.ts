import { Moneda } from './moneda.enum';
import { PagoInicialRequestDTO } from './pagoinicialrequest.dto';
import { TipoPropietario } from '../enums/tipopropietario.enum';

/** Cliente dentro del contrato con su rol (TITULAR, AVAL, CONYUGE, etc.). */
export interface ContratoClienteRequestDTO {
  idCliente: number;
  tipoPropietario: TipoPropietario;
}

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
  /** Clientes con su rol. Si viene vacío, el backend usa idClientes como fallback (todos TITULAR). */
  clientes?: ContratoClienteRequestDTO[];
  /** Legacy: lista plana de IDs, todos TITULAR. Se usa solo si clientes está vacío. */
  idClientes: number[];
  idLotes: number[];
  moneda: Moneda;
  /** Solo cuando hay inicial > 0 en contrato financiado */
  pagoInicial?: PagoInicialRequestDTO | null;
}