import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeparacionDTO } from '../dto/separacion.dto'; 
import { Separacion } from '../models/separacion.model';
import { SeparacionResumen } from '../dto/separacionresumen.dto';

@Injectable({
  providedIn: 'root'
})
export class SeparacionService {

  private apiUrl = 'http://localhost:8081/api/separaciones'; 

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el listado resumido para la tabla principal.
   * Eliminamos el .pipe(map) porque el Backend ya envía la estructura
   * de SeparacionResumen (con listas de clientes y lotes).
   */
  obtenerSeparacionResumen(): Observable<SeparacionResumen[]> {
    return this.http.get<SeparacionResumen[]>(`${this.apiUrl}/resumen`);
  }

  /**
   * Busca separaciones por filtro de texto.
   */
  buscarSeparaciones(filtro: string): Observable<SeparacionDTO[]> {
    return this.http.get<SeparacionDTO[]>(`${this.apiUrl}/buscar`, { params: { filtro } });
  }

  /**
   * Obtiene la entidad completa por ID.
   */
  obtenerSeparacionPorId(id: number): Observable<Separacion> {
    return this.http.get<Separacion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva separación.
   */
  crearSeparacion(separacion: Separacion): Observable<Separacion> {
    return this.http.post<Separacion>(this.apiUrl, separacion);
  }

  /**
   * Actualiza una separación.
   */
  actualizarSeparacion(id: number, separacion: Separacion): Observable<Separacion> {
    return this.http.put<Separacion>(`${this.apiUrl}/${id}`, separacion);
  }

  /**
   * Elimina una separación.
   */
  eliminarSeparacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarSeparaciones(): Observable<Separacion[]> {
    return this.http.get<Separacion[]>(this.apiUrl);
  }
}