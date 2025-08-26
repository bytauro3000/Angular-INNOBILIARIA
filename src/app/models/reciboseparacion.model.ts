import { Separacion } from "./separacion.model";
import { usuario } from "./usuario.model";

export interface ReciboSeparacion{
    idRecibo : number;
    separacion : Separacion;
    numeroRecibo? : string;
    usuario : usuario;
    fechaEmision : string;

}