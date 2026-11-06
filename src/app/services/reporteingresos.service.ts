import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumenIngresosRangoDTO } from '../dto/resumen-ingresos-rango.dto';
import { ReporteIngresosDetalladoDTO } from '../dto/ingreso-detallado.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteIngresosService {

  private readonly apiUrl = `${environment.apiUrl}/api/reporte-ingresos`;

  constructor(private http: HttpClient) {}

  obtenerIngresosPorRango(desde: string, hasta: string): Observable<ResumenIngresosRangoDTO> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);
    return this.http.get<ResumenIngresosRangoDTO>(this.apiUrl, { params });
  }

  // ── Reporte de ingresos detallado (comprobantes BOLETA/RECIBO) ─────────────

  obtenerIngresosDetallados(
      desde: string, hasta: string, tipo: string): Observable<ReporteIngresosDetalladoDTO> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('tipo', tipo);
    return this.http.get<ReporteIngresosDetalladoDTO>(`${this.apiUrl}/detallado`, { params });
  }

  descargarDetalladoPdf(desde: string, hasta: string, tipo: string): Observable<Blob> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('tipo', tipo);
    return this.http.get(`${this.apiUrl}/detallado/pdf`, { params, responseType: 'blob' });
  }

  descargarDetalladoExcel(desde: string, hasta: string, tipo: string): Observable<Blob> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('tipo', tipo);
    return this.http.get(`${this.apiUrl}/detallado/excel`, { params, responseType: 'blob' });
  }
}