import { Moneda } from './moneda.enum';
import { PagoInicialRequestDTO } from './pagoinicialrequest.dto';

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
  idClientes: number[];
  idLotes: number[];
  moneda: Moneda;
  /** Solo cuando hay inicial > 0 en contrato financiado */
  pagoInicial?: PagoInicialRequestDTO | null;
}