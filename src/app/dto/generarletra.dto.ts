import { GrupoLetras } from './grupo-letras.dto';
 
export interface GenerarLetrasRequest {
  idDistrito: number;
  fechaGiro: string;
  fechaVencimientoInicial: string;
  importe: string;
  importeLetras: string;
  modoAutomatico: boolean;
  modoGrupos: boolean;         // NUEVO: activa el modo de grupos
  grupos: GrupoLetras[];       // NUEVO: lista de grupos con cantidad e importe
  usarUltimoDiaMes: boolean;
}