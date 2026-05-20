import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReporteClientesMoraDTO } from '../dto/reporte-mora.dto';

@Injectable({ providedIn: 'root' })
export class ReporteMoraService {

  private apiUrl = `${environment.apiUrl}/api/reporte-mora`;

  constructor(private http: HttpClient) {}

  obtenerClientesEnMora(): Observable<ReporteClientesMoraDTO[]> {
    return this.http.get<ReporteClientesMoraDTO[]>(`${this.apiUrl}/clientes`);
  }

  descargarPdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/clientes/pdf`, { responseType: 'blob' });
  }
}