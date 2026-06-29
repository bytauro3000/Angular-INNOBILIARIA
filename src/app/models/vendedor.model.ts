import { Distrito } from "./distrito.model";
import { Genero } from "../enums/Genero.enum";

export interface Vendedor{
  idVendedor?: number;
  nombre: string;
  apellidos: string;
  dni: string;
  celular?: string;
  email?: string;
  direccion?: string;   // 👈 importante
  fechaNacimiento?: string;
  genero?: Genero;
  comision?: number | null;
  distrito: Distrito;
}

