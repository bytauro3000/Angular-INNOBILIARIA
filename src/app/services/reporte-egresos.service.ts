import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumenEgresosRangoDTO } from '../dto/resumen-egresos-rango.dto';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteEgresosService {

  private readonly apiUrl = `${environment.apiUrl}/api/reporte-egresos`;

  constructor(private http: HttpClient) {}

  obtenerEgresosPorRango(desde: string, hasta: string): Observable<ResumenEgresosRangoDTO> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);
    return this.http.get<ResumenEgresosRangoDTO>(this.apiUrl, { params });
  }
}