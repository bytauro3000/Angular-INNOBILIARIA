import { Genero } from "../enums/Genero.enum";
import { Distrito } from "../models/distrito.model";
import { EstadoCivil } from "../enums/estadocivil.enum";
import { TipoCliente } from "../enums/tipocliente.enum";
import { EstadoCliente } from "../enums/estadocliente.enum";

export interface ClienteResponseDTO {
  idCliente: number;
  nombre: string;
  apellidos: string;
  numDoc: string;
  direccion: string;
  celular: string;
  telefono?: string;
  email?: string;
  distrito: Distrito;
  genero: Genero;
  estadoCivil: EstadoCivil;
  tipoCliente: TipoCliente;
  nacionalidad?: string;
  estado: EstadoCliente;
}