import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AgendaEvent {
  idAgenda?: number;
  fecha: string;
  hora?: string;
  titulo: string;
  descripcion?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  recordatorioEnviado?: boolean;
  fechaCreacion?: string;
  usuarioCreacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private readonly apiUrl = `${environment.apiUrl}/api/agendas`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<AgendaEvent[]> {
    return this.http.get<AgendaEvent[]>(this.apiUrl);
  }

  listarPorFecha(fecha: string): Observable<AgendaEvent[]> {
    return this.http.get<AgendaEvent[]>(`${this.apiUrl}/fecha/${fecha}`);
  }

  listarPorRango(inicio: string, fin: string): Observable<AgendaEvent[]> {
    return this.http.get<AgendaEvent[]>(`${this.apiUrl}/rango`, {
      params: { inicio, fin }
    });
  }

  listarPendientes(): Observable<AgendaEvent[]> {
    return this.http.get<AgendaEvent[]>(`${this.apiUrl}/pendientes`);
  }

  listarHoy(): Observable<AgendaEvent[]> {
    return this.http.get<AgendaEvent[]>(`${this.apiUrl}/hoy`);
  }

  obtenerPorId(id: number): Observable<AgendaEvent> {
    return this.http.get<AgendaEvent>(`${this.apiUrl}/${id}`);
  }

  crear(evento: AgendaEvent): Observable<AgendaEvent> {
    return this.http.post<AgendaEvent>(this.apiUrl, evento);
  }

  actualizar(id: number, evento: AgendaEvent): Observable<AgendaEvent> {
    return this.http.put<AgendaEvent>(`${this.apiUrl}/${id}`, evento);
  }

  cambiarEstado(id: number, estado: string): Observable<AgendaEvent> {
    return this.http.patch<AgendaEvent>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}