import { Distrito } from "./distrito.model";

export interface Vendedor{
  idVendedor?: number;
  nombre: string;
  apellidos: string;
  dni: string;
  celular?: string;
  email?: string;
  direccion?: string;   // 👈 importante
  fechaNacimiento?: Date | null;
  genero?: string;
  comision?: number | null;
  distrito: Distrito;
}

