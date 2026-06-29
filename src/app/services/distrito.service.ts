// src/app/services/distrito.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Distrito } from '../models/distrito.model';
import { environment } from '../../environments/environment'; // Importamos el environment para usar la URL base

@Injectable({
  providedIn: 'root'
})
export class DistritoService {
  // ✅ URL base actualizada
  private readonly apiUrl = `${environment.apiUrl}/api/distritos`;

  /** Cache de distritos: se carga una sola vez y se reutiliza en toda la aplicación */
  private distritos$?: Observable<Distrito[]>;

  constructor(private http: HttpClient) {}

  // 🔹 Listar todos los distritos (con cache)
  listarDistritos(): Observable<Distrito[]> {
    if (!this.distritos$) {
      this.distritos$ = this.http.get<Distrito[]>(`${this.apiUrl}/listar`).pipe(
        shareReplay(1)
      );
    }
    return this.distritos$;
  }

  // 🔹 Obtener un distrito por ID
  obtenerDistritoPorId(id: number): Observable<Distrito> {
    return this.http.get<Distrito>(`${this.apiUrl}/obtener/${id}`);
  }
}