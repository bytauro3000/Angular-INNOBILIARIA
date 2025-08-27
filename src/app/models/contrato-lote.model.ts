import { Contrato } from './contrato.model';
import { Lote } from './lote.model';
import { ContratoLoteId } from './contrato-lote-id.model';

// Interfaz principal para la entidad ContratoLote
export interface ContratoLote {
  id: ContratoLoteId;
  contrato: Contrato;
  lote: Lote;
}