import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LecturaUnificadaDTO } from '../dto/Lecturaunificada.dto';

@Injectable({
  providedIn: 'root'
})
export class LecturaService {
  private apiUrl = `${environment.apiUrl}/api/gateway/recibos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la planilla con ambos servicios para un programa.
   * Se eliminan los filtros de Mz y Lt aquí para que la memoria 
   * del componente sea la que gestione la vista sin perder datos.
   */
  prepararPlanillaUnificada(idPrograma: number): Observable<LecturaUnificadaDTO[]> {
    const params = new HttpParams().set('idPrograma', idPrograma.toString());
    return this.http.get<LecturaUnificadaDTO[]>(`${this.apiUrl}/preparar-planilla-unificada`, { params });
  }

  /**
   * Envía la planilla unificada completa para el registro de recibos.
   */
  guardarPlanillaUnificada(recibos: LecturaUnificadaDTO[], fechaGiro: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-planilla-unificada?fechaGiro=${fechaGiro}`, recibos);
  }

  /**
   * Obtiene la configuración de precios (S/ por kWh o m3)
   */
  obtenerConfiguracion(tipo: 'LUZ' | 'AGUA'): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/configuraciones/${tipo}`);
  }
}