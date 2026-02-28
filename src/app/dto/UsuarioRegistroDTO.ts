export interface UsuarioRegistroDTO {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  telefono: string;
  direccion: string;
  dni: string;
  idRol: number; // 1: Secretaria, 2: Soporte, 3: Administrador
  estado: string; // 'activo' o 'inactivo'
}