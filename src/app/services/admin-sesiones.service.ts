import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioActivoDTO {
  sesionId: number;
  usuarioId: number;
  nombre: string;
  correo: string;
  ip: string;
  userAgent: string;
  desde: string;
  ultimoRefresh: string;
}

export interface SesionResumenDTO {
  usuariosActivos: number;
  visitasHoy: number;
  sesiones: UsuarioActivoDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminSesionesService {
  private readonly url = `${environment.apiUrl}/api/admin/sesiones`;

  constructor(private http: HttpClient) {}

  obtenerResumen(): Observable<SesionResumenDTO> {
    return this.http.get<SesionResumenDTO>(this.url);
  }
}
