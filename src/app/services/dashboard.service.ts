import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData } from '../models/dashboard.model'; // 👈 Importamos la interfaz correcta

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/dashboard/totales';

  constructor(private http: HttpClient) {}

  getTotales(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }
}