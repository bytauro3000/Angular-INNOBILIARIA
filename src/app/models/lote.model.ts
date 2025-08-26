import { EstadoLote } from "../enums/estadolote.enum";
import { Programa } from "./programa.model";

export interface Lote{
  idLote?: number; // opcional si lo genera el backend
  manzana: string;
  numeroLote: string;
  area: number;
  largo1?: number;
  largo2?: number;
  ancho1?: number;
  ancho2?: number;
  precioM2?: number;
  colindanteNorte?: string;
  colindanteSur?: string;
  colindanteEste?: string;
  colindanteOeste?: string;
  estado?: EstadoLote;
    programa?: Programa; 
}