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

  // URL base de tu API de Spring Boot para separaciones
  private apiUrl = 'http://localhost:8080/api/separaciones'; 

  constructor(private http: HttpClient) { }
//Listado principal
obtenerSeparacionResumen(): Observable<SeparacionResumen[]> {
  return this.http.get<any[]>(`${this.apiUrl}/resumen`).pipe(
    map((separaciones) =>
      separaciones.map((s) => ({
        idSeparacion: s.idSeparacion,
        dni: s.dni ?? '',
        nomApeCli: s.nomApeCli ?? 'Sin nombre',
        manLote: s.manLote ?? 'Sin lote',
        monto: s.monto ?? 0,
        fechaSepara: s.fechaSepara ?? '',
        fechaLimite: s.fechaLimite ?? '',
        estadoSeparacion: s.estadoSeparacion ?? EstadoSeparacion.EN_PROCESO
      }))
    )
  );
}
  buscarSeparaciones(filtro: string): Observable<SeparacionDTO[]> {
    // Realiza una petición GET al endpoint con el parámetro 'filtro'
    return this.http.get<SeparacionDTO[]>(`${this.apiUrl}/buscar`, { params: { filtro } });
  }
  //  Listar todas las separaciones
  listarSeparaciones(): Observable<Separacion[]> {
    return this.http.get<Separacion[]>(`${this.apiUrl}`);
  }

  //  Obtener una separación por ID
  obtenerSeparacionPorId(id: number): Observable<Separacion> {
    return this.http.get<Separacion>(`${this.apiUrl}/${id}`);
  }

  //  Crear nueva separación
  crearSeparacion(separacion: Separacion): Observable<Separacion> {
    return this.http.post<Separacion>(this.apiUrl, separacion);
  }

  //  Actualizar separación existente
  actualizarSeparacion(id: number, separacion: Separacion): Observable<Separacion> {
    return this.http.put<Separacion>(`${this.apiUrl}/${id}`, separacion);
  }

  //  Eliminar separación
  eliminarSeparacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
