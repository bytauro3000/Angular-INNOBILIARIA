export interface UsuarioChat {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  iniciales: string;
  online: boolean;
  ultimoMsj?: string;
  ultimaFecha?: string;
  noLeidos: number;
}

export interface Mensaje {
  id: number;
  remitenteId: number;
  destinatarioId: number;
  contenido: string;
  fecha: string;
  estado: 'ENVIADO' | 'LEIDO';
}

export interface MensajeDTO {
  remitenteId: number;
  destinatariosIds: number[];
  contenido: string;
}
