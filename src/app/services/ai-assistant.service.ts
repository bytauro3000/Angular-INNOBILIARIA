import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AsistenteResponse {
  respuesta: string;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {

  private readonly apiUrl = `${environment.apiUrl}/api/ai/asistente`;

  constructor(private http: HttpClient) {}

  consultar(mensaje: string): Observable<AsistenteResponse> {
    return this.http.post<AsistenteResponse>(this.apiUrl, { mensaje });
  }
}
