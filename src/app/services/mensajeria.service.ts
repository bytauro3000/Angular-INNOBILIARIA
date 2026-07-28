import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioChat, Mensaje, MensajeDTO } from '../models/mensajeria.models';

@Injectable({ providedIn: 'root' })
export class MensajeriaService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerUsuarios(): Observable<UsuarioChat[]> {
    return this.http.get<UsuarioChat[]>(`${this.API_URL}/api/mensajes/usuarios`);
  }

  obtenerHistorial(idRemitente: number, idDestinatario: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.API_URL}/api/mensajes/historial/${idRemitente}/${idDestinatario}`);
  }

  enviarMensaje(body: MensajeDTO): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.API_URL}/api/mensajes/enviar-rest`, body);
  }

  obtenerNoLeidos(userId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/api/mensajes/no-leidos/${userId}`);
  }
}
