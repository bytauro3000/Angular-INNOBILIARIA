export interface EmpresaPublic {
  nombreLegal: string;
  nombreComercial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  celular: string;
  email: string;
  logoUrl: string;
  logoSmallUrl?: string;
  paginaWeb: string;
  whatsapp: string;
}

export interface EmpresaResponse {
  id: number;
  nombreLegal: string;
  nombreComercial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  celular: string;
  email: string;
  logoUrl: string;
  logoSmallUrl?: string;
  paginaWeb: string;
  whatsapp?: string;
  representanteLegal?: string;
  representanteDni?: string;
  partidaElectronica?: string;
  ubigeo?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  tipoCalculoMora?: string;
  moraPorcentaje?: number;
  moraMontoDiario?: number;
  moraTasaDiaria?: number;
  apisperuEnvironment?: string;
  whatsappDeviceId?: string;
  notificacionEmail?: string;
  activa: boolean;
  fechaRegistro: string;
  fechaActualizacion?: string;
}

export interface EmpresaRequest {
  nombreLegal: string;
  nombreComercial?: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  paginaWeb?: string;
  whatsapp?: string;
  representanteLegal?: string;
  representanteDni?: string;
  partidaElectronica?: string;
  ubigeo?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  tipoCalculoMora?: string;
  moraPorcentaje?: number;
  moraMontoDiario?: number;
  moraTasaDiaria?: number;
  apisperuEnvironment?: string;
  whatsappDeviceId?: string;
  notificacionEmail?: string;
}
