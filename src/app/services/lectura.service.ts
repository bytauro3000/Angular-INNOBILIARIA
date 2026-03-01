import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LecturaUnificadaDTO } from '../dto/Lecturaunificada.dto';
import { ReciboConClienteDTO } from '../dto/reciboconcliente.dto';

@Injectable({
  providedIn: 'root'
})
export class LecturaService {
  private apiUrl = `${environment.apiUrl}/api/gateway/recibos`;

  constructor(private http: HttpClient) { }

  prepararPlanillaUnificada(idPrograma: number): Observable<LecturaUnificadaDTO[]> {
    const params = new HttpParams().set('idPrograma', idPrograma.toString());
    return this.http.get<LecturaUnificadaDTO[]>(`${this.apiUrl}/preparar-planilla-unificada`, { params });
  }

  // 👇 MODIFICADO: ahora recibe fechaLectura
  guardarPlanillaUnificada(recibos: LecturaUnificadaDTO[], fechaGiro: string, fechaLectura: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaGiro', fechaGiro)
      .set('fechaLectura', fechaLectura);
    return this.http.post(`${this.apiUrl}/guardar-planilla-unificada`, recibos, { params });
  }

  obtenerConfiguracion(tipo: 'LUZ' | 'AGUA'): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/configuraciones/${tipo}`);
  }

  obtenerRecibos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  filtrarRecibos(mes: number, anio: number, tipoServicio: string): Observable<ReciboConClienteDTO[]> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString())
      .set('tipoServicio', tipoServicio);
    const url = `${this.apiUrl}/listar-con-filtros`;
    console.log('URL generada:', url);
    return this.http.get<ReciboConClienteDTO[]>(url, { params });
  }

  generarPdfRecibo(idRecibo: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/generar-pdf/${idRecibo}`, {
      responseType: 'blob',
      observe: 'response'  // 👈 esto permite acceder a los headers
    });
  }
}