import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Distrito } from '../models/distrito.model';

@Injectable({
  providedIn: 'root'
})
export class DistritoService {
  private apiUrl = 'http://localhost:8080/api/distritos';

  constructor(private http: HttpClient) {}

  // Obtener el token desde localStorage
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // 👈 cuando hagas login, guarda el JWT aquí
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  listarDistritos(): Observable<Distrito[]> {
    return this.http.get<Distrito[]>(`${this.apiUrl}/listar`, { headers: this.getHeaders() });
  }

  obtenerDistritoPorId(id: number): Observable<Distrito> {
    return this.http.get<Distrito>(`${this.apiUrl}/obtener/${id}`, { headers: this.getHeaders() });
  }
}
