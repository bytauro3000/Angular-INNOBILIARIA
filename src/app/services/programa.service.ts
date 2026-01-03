// src/app/services/programa.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Programa } from '../models/programa.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramaService {
  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/programas';

  constructor(private http: HttpClient) {}

  // LISTAR
  listarProgramas(): Observable<Programa[]> {
    return this.http.get<Programa[]>(this.apiUrl);
  }

  // CREAR
  crearPrograma(programa: Programa): Observable<Programa> {
    return this.http.post<Programa>(this.apiUrl, programa);
  }

  // ACTUALIZAR
  actualizarPrograma(id: number, programa: Programa): Observable<Programa> {
    return this.http.put<Programa>(`${this.apiUrl}/${id}`, programa);
  }

  // ELIMINAR
  eliminarPrograma(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 📥 DESCARGAR EXCEL
descargarExcel(): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/reporte-excel`, { responseType: 'blob' });
}

}
