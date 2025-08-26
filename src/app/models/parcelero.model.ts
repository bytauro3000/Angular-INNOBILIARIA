import { Distrito } from './distrito.model';

export interface Parcelero {
  idParcelero?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  celular?: string;
  direccion?: string;
  email?: string;
  distrito?: Distrito;
}
