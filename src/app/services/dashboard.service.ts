import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'http://localhost:8081/api/dashboard/totales'; // 👈 Corregido aquí

  constructor(private http: HttpClient) {}

  getTotales(): Observable<{ lotes: number, parceleros: number, vendedores: number, programas: number }> {
    return this.http.get<{ lotes: number, parceleros: number, vendedores: number, programas: number }>(this.apiUrl);
  }
}