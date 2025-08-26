import { EstadoLote } from "../enums/estadolote.enum";

export interface LoteResumen {
  idLote : number;
  manzana: string;
  numeroLote: string;
  area: number;
  precioM2: number;
  estado: EstadoLote;
  programaNombre: string;
}
