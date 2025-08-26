import { EstadoCliente } from '../enums/estadocliente.enum';
import {TipoCliente } from '../enums/tipocliente.enum';
import { Distrito } from './distrito.model';

export interface Cliente {
  idCliente: number;
  nombre: string;
  apellidos?: string;
  tipoCliente: TipoCliente;
  numDoc: string;
  celular: string;
  telefono?: string;
  direccion: string;
  email: string;
  fechaRegistro?: Date | string; // ✅ solo lectura, lo llena el backend
  estado: EstadoCliente;
  distrito: Distrito; // Relación ManyToOne
}