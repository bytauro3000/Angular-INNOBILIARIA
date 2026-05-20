import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData} from '../models/dashboard.model';
import { IngresoDiarioDTO } from '../dto/ingresodiario.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard`;

  constructor(private http: HttpClient) {}

  getTotales(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/totales`);
  }

  getIngresosDiarios(fecha?: string): Observable<IngresoDiarioDTO> {
    const params = fecha ? `?fecha=${fecha}` : '';
    return this.http.get<IngresoDiarioDTO>(`${this.apiUrl}/ingresos-diarios${params}`);
  }
}