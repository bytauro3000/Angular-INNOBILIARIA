// src/app/services/distrito.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Distrito } from '../models/distrito.model';

@Injectable({
  providedIn: 'root'
})
export class DistritoService {
  // ✅ URL base actualizada
  private apiUrl = '${environment.apiUrl}/api/distritos';

  constructor(private http: HttpClient) {}

  // 🔹 Listar todos los distritos
  listarDistritos(): Observable<Distrito[]> {
    //Endpoint actualizado
    return this.http.get<Distrito[]>(`${this.apiUrl}/listar`);
  }

  // 🔹 Obtener un distrito por ID
  obtenerDistritoPorId(id: number): Observable<Distrito> {
    //Endpoint actualizado
    return this.http.get<Distrito>(`${this.apiUrl}/obtener/${id}`);
  }
}