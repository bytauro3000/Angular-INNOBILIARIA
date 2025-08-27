// src/app/models/letra-cambio.model.ts

import { Contrato } from './contrato.model';
import { EstadoLetra } from '../enums/estadoletra';
import { TipoComprobante } from '../enums/tipocomprobante';
import { Distrito } from './distrito.model';


export interface LetraCambio {
  idLetra?: number;
  contrato: Contrato;
  distrito: Distrito;
  numeroLetra: string;
  fechaGiro: string;
  fechaVencimiento: string;
  importe: number;
  importeLetras?: string;
  estado?: EstadoLetra;
  fechaPago?: string;
  tipoComprobante?: TipoComprobante;
  numeroComprobante?: string;
  observaciones?: string;
}
