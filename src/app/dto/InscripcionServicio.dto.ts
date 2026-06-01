import { EstadoInscripcion } from '../enums/estadoinscripcion.enum';
import { TipoServicios } from '../enums/tiposervicio';

export interface InscripcionServicioDTO {
    
  idInscripcion?: number;
  idContrato: number;
  tipoServicio: TipoServicios | string;
  montoTotal?: number;
  montoAcumulado?: number;
  fechaInscripcion?: string | Date;

  /** PENDIENTE_PAGO | PENDIENTE_CONEXION | ACTIVO | SUSPENDIDO | CANCELADO */
  estado?: EstadoInscripcion | string;
}
