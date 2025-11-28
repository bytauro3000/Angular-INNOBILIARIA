
import { EstadoSeparacion } from "../enums/estadoseparacion.enum";
import { Cliente } from "./cliente.model";
import { Lote } from "./lote.model";
import { Vendedor } from "./vendedor.model";

export interface Separacion{
    idSeparacion? : number;
    cliente?: Cliente;
    vendedor? : Vendedor;
    lote? : Lote;
    monto : number;
    fechaSeparacion : string;
    fechaLimite : string;
    estado? : EstadoSeparacion;
    observaciones? : string;

}
