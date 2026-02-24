import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LecturaService {
  private apiUrl = `${environment.apiUrl}/api/gateway/recibos`;

  constructor(private http: HttpClient) {}

  // Obtiene la lista cruzada (Nombres + Lectura Anterior)
  prepararPlanilla(tipo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/preparar-planilla?tipo=${tipo}`);
  }

  // Envía la lista completa para registro masivo
  guardarPlanilla(recibos: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-planilla`, recibos);
  }
}