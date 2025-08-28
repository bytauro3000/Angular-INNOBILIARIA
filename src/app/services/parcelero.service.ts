import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Parcelero } from '../models/parcelero.model';

@Injectable({
  providedIn: 'root'
})
export class ParceleroService {

  private apiUrl = 'http://localhost:8080/api/parceleros';

  constructor(private http: HttpClient) {}

  // LISTAR TODOS
  listarParceleros(): Observable<Parcelero[]> {
    return this.http.get<Parcelero[]>(this.apiUrl);
  }

  // OBTENER POR ID
  obtenerParceleroPorId(id: number): Observable<Parcelero> {
    return this.http.get<Parcelero>(`${this.apiUrl}/${id}`);
  }

  // CREAR
  crearParcelero(parcelero: Parcelero): Observable<Parcelero> {
    return this.http.post<Parcelero>(this.apiUrl, parcelero);
  }

  // ACTUALIZAR
  actualizarParcelero(id: number, parcelero: Parcelero): Observable<Parcelero> {
    return this.http.put<Parcelero>(`${this.apiUrl}/${id}`, parcelero);
  }

  // ELIMINAR
  eliminarParcelero(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

