import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData } from '../models/dashboard.model'; // 👈 Importamos la interfaz correcta
import { environment } from '../../environments/environment'; // Importamos el environment para usar la URL base
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard/totales`;

  constructor(private http: HttpClient) {}

  getTotales(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }
}