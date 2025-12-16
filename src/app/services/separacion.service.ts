import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { SeparacionDTO } from '../dto/separacion.dto'; 
import { Separacion } from '../models/separacion.model';
import { SeparacionResumen } from '../dto/separacionresumen.dto';
import { EstadoSeparacion } from '../enums/estadoseparacion.enum';

@Injectable({
  providedIn: 'root'
})
export class SeparacionService {

  private apiUrl = 'http://localhost:8081/api/separaciones'; 

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el listado resumido para la tabla principal.
   * Ajustado para coincidir con el SeparacionResumenDTO del Backend.
   */
  obtenerSeparacionResumen(): Observable<SeparacionResumen[]> {
    return this.http.get<any[]>(`${this.apiUrl}/resumen`).pipe(
      map((separaciones) =>
        separaciones.map((s) => ({
          idSeparacion: s.idSeparacion,
          dni: s.numDoc ?? '', // Cambiado de s.dni a s.numDoc según tu repositorio Java
          nomApeCli: s.nomApeCli ?? 'Sin nombre',
          manLote: s.manLote ?? 'Sin lote',
          monto: s.monto ?? 0,
          fechaSepara: s.fechaSeparacion ?? '', // Coincidiendo con el nombre del campo del DTO
          fechaLimite: s.fechaLimite ?? '',
          estadoSeparacion: s.estado ?? EstadoSeparacion.EN_PROCESO // Coincidiendo con s.estado
        }))
      )
    );
  }

  /**
   * Busca separaciones por filtro de texto (DNI o Apellido).
   * Este método es vital para el buscador del componente Contrato.
   */
  buscarSeparaciones(filtro: string): Observable<SeparacionDTO[]> {
    return this.http.get<SeparacionDTO[]>(`${this.apiUrl}/buscar`, { params: { filtro } });
  }

  /**
   * Obtiene la entidad completa. 
   * Ahora incluirá las listas 'clientes' y 'lotes'.
   */
  obtenerSeparacionPorId(id: number): Observable<Separacion> {
    return this.http.get<Separacion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva separación.
   * El objeto 'separacion' ya debe contener las listas de clientes y lotes.
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