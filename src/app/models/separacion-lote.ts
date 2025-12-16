import { Separacion } from './separacion.model';
import { Lote } from './lote.model';
import { SeparacionLoteId } from './separacion-lote-id';

// Interfaz principal para la entidad ContratoLote
export interface SeparacionLote {
  id: SeparacionLoteId;
  separacion: Separacion;
  lote: Lote;
}