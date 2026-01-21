import { EstadoCliente } from '../enums/estadocliente.enum';
import {TipoCliente } from '../enums/tipocliente.enum';
import { Distrito } from './distrito.model';
import { Genero } from '../enums/Genero.enum';
import { EstadoCivil } from '../enums/estadocivil.enum';

export interface Cliente {
  idCliente: number;
  nombre: string;
  apellidos: string;
  estadoCivil: EstadoCivil; 
  tipoCliente: TipoCliente;
  numDoc: string;
  celular: string;
  telefono?: string;
  direccion: string;
  email?: string;
  genero: Genero;
  fechaRegistro?: Date | string; // ✅ solo lectura, lo llena el backend
  estado: EstadoCliente;
  distrito: Distrito; // Relación ManyToOne
}