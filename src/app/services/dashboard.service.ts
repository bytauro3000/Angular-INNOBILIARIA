import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definimos la estructura de la respuesta para mayor seguridad
export interface DashboardData {
  lotes: number;
  parceleros: number;
  vendedores: number;
  programas: number;
  clientes: number; // Nuevo contador
  graficoLotes: {
    [nombrePrograma: string]: {
      Disponible?: number;
      Separado?: number;
      Vendido?: number;
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/dashboard/totales';

  constructor(private http: HttpClient) {}

  // Ahora retornamos un Observable de la interface DashboardData
  getTotales(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }
}