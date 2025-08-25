import { EstadoCliente } from '../enums/estadocliente.enum';
import {TipoCliente } from '../enums/tipocliente.enum';
import { Distrito } from './distrito.model';

export interface Cliente {
  idCliente: number;
  nombre: string;
  apellidos?: string;
  tipoCliente: TipoCliente;
  dni?: string;
  ruc?: string;
  celular: string;
  telefono?: string;
  direccion: string;
  email: string;
  fechaRegistro?: Date | string; // Flexible para recibir string del JSON y convertirlo a Date
  estado: EstadoCliente;
  distrito: Distrito; // Relación ManyToOne
}
