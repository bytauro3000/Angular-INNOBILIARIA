import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumenIngresosRangoDTO } from '../dto/resumen-ingresos-rango.dto';
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
}