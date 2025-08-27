import { Separacion } from "./separacion.model";
import { Usuario } from "./usuario.model";

export interface ReciboSeparacion{
    idRecibo : number;
    separacion : Separacion;
    numeroRecibo? : string;
    usuario : Usuario;
    fechaEmision : string;

}