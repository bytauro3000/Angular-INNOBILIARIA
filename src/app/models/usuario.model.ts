import { EstadoUsuario } from "../enums/estadousuario.enum";
import { RolUsuario } from "./rolusuario..model";

export interface usuario{
     id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    contrasena: string;
    telefono?: string;
    direccion?: string;
    dni?: string;
    estado : EstadoUsuario;
    fechaRegistro : string;
    rol : RolUsuario;
}