
import { EstadoInscripcion } from '../enums/estadoinscripcion.enum';
import { TipoServicios } from '../enums/tiposervicio';

export interface InscripcionServicioDTO {
    idInscripcion?: number; 
    idContrato: number;
    tipoServicio: TipoServicios | string;
    montoPagado: number;
    fechaInscripcion?: string | Date;
    estado?: EstadoInscripcion | string;
}