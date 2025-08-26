import { Genero } from "../enums/Genero.enum";
import { Distrito } from "./distrito.model";

export interface Vendedor{
    idVendedor : number;
    nombre : string;
    apellidos : string;
    dni : string;
    celular? : string;
    email?: string;
    direccion? : string;
    fechaNacimiento? : string;
    genero : Genero;
    comision? : number;
    distrito ?: Distrito;
}

