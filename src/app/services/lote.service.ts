import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { LoteResumen } from '../dto/loteresumen.dto';
import { EstadoLote } from '../enums/estadolote.enum';
import { Lote } from '../models/lote.model';
import { LoteProgramaDTO } from '../dto/lote-programa-response.dto';

@Injectable({
  providedIn: 'root'
})
export class LoteService {
  
  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/lotes';

  constructor(private http: HttpClient) {}

  // 🔹 Listado principal (Resumen para la tabla)
  obtenerLotesResumen(): Observable<LoteResumen[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((lotes) =>
        lotes.map((lote) => ({
          idLote: lote.idLote,
          manzana: lote.manzana,
          numeroLote: lote.numeroLote,
          area: lote.area,
          precioM2: lote.precioM2,
          estado: lote.estado as EstadoLote,
          programaNombre: lote.programa?.nombrePrograma ?? 'Sin programa'
        }))
      )
    );
  }

  // 🔹 Listado Completo (Entidad Lote)
  listarLotes(): Observable<Lote[]> {
    return this.http.get<Lote[]>(this.apiUrl);
  }

  // 🔹 Listar lotes por programa usando el DTO optimizado
  listarLotesPorPrograma(idPrograma: number): Observable<LoteProgramaDTO[]> {
    return this.http.get<LoteProgramaDTO[]>(`${this.apiUrl}/listarPorPrograma/${idPrograma}`);
  }

  // 🔹 Obtener un objeto Lote por Id
  obtenerLotePorId(id: number): Observable<Lote> {
    return this.http.get<Lote>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Obtener la entidad completa por programa
  listarLotesEntidadPorPrograma(idPrograma: number): Observable<Lote[]> {
    return this.http.get<Lote[]>(`${this.apiUrl}/gestion/programa/${idPrograma}`);
  }

  // 🔹 Crear Lote (POST)
  crearLote(lote: Lote): Observable<Lote> {
    return this.http.post<Lote>(this.apiUrl, lote);
  }

  /**
   * 🔹 Actualizar Lote (PUT)
   * CORRECCIÓN: Se cambió .post por .put para coincidir con el @PutMapping del Backend
   * y evitar el error 403 Forbidden provocado por desajuste de métodos.
   */
  actualizarLote(id: number, lote: Lote): Observable<Lote> {
    return this.http.put<Lote>(`${this.apiUrl}/${id}`, lote);
  }

  // 🔹 Eliminar Lote (DELETE)
  eliminarLote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Obtener todos los lotes de un programa (entidad completa para gestión)
  obtenerLotesPorProgramaGestion(idPrograma: number): Observable<LoteResumen[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gestion/programa/${idPrograma}`).pipe(
      map((lotes) =>
        lotes.map((lote) => ({
          idLote: lote.idLote,
          manzana: lote.manzana,
          numeroLote: lote.numeroLote,
          area: lote.area,
          precioM2: lote.precioM2,
          estado: lote.estado as EstadoLote,
          programaNombre: lote.programa?.nombrePrograma ?? 'Sin programa'
        }))
      )
    );
  }
}