export interface UsuarioRegistroDTO {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  direccion?: string;
  dni?: string;
  idRol: number;
  estado?: string;
  idDistrito?: number | null;
}