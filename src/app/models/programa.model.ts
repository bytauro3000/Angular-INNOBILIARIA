import { Parcelero } from './parcelero.model';
import { Distrito } from './distrito.model';

export interface Programa {
  idPrograma?: number;
  nombrePrograma: string;
  ubicacion?: string;
  areaTotal: number;
  precioM2?: number;
  costoTotal?: number;
  parcelero?: Parcelero;
  distrito?: Distrito;
}
