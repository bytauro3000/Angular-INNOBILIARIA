import { EstadoSeparacion } from "../enums/estadoseparacion.enum";



export interface SeparacionResumen{
idSeparacion : number;
dni : string;
nomApeCli : string;
manLote : string;
monto : number;
fechaSepara : string;
fechaLimite : string;
estadoSeparacion : EstadoSeparacion;
}