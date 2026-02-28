import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Ajusta la ruta si es necesario

@Injectable({
  providedIn: 'root'
})
export class MensajeriaService {
  
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 🔹 1. Obtener lista de usuarios
 obtenerUsuarios(): Observable<any[]> {
  return this.http.get<any[]>(`${this.API_URL}/api/usuarios/listar`);
}

  // 🔹 2. Obtener historial de chat entre dos personas
  obtenerHistorial(idRemitente: number, idDestinatario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/api/mensajes/historial/${idRemitente}/${idDestinatario}`);
  }

  // 🔹 3. Enviar mensaje por REST
  enviarMensaje(body: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/api/mensajes/enviar-rest`, body);
  }
}