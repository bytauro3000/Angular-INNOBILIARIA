import { Genero } from "../enums/Genero.enum"; // Asegúrate de que la ruta sea correcta
import { Distrito } from "../models/distrito.model";

export interface ClienteResponseDTO {
  idCliente: number;
  nombre: string;
  apellidos: string;
  numDoc: string;
  direccion: string;
   celular: string;
  distrito: Distrito;
  genero: Genero; 
}