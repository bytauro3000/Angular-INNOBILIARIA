import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { LoteResumen } from '../dto/loteresumen.dto';
import { EstadoLote } from '../enums/estadolote.enum';
import { Lote } from '../models/lote.model';
import { Programa } from '../models/programa.model';
import { LoteProgramaDTO } from '../dto/lote-programa-response.dto';


@Injectable({
  providedIn: 'root'
})
export class LoteService {
constructor(private http: HttpClient) {}
private apiUrl = 'http://localhost:8080/api/lotes';
private programaUrl = 'http://localhost:8080/api/programas'; // Programas
//Listado principal
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

//Listado Completo
listarLotes(): Observable<Lote[]>{
return this.http.get<Lote[]>(this.apiUrl+`/lotes`);
}

// Listar lotes por programa usando el DTO optimizado
listarLotesPorPrograma(idPrograma: number): Observable<LoteProgramaDTO[]> {
  return this.http.get<LoteProgramaDTO[]>(`${this.apiUrl}/listarPorPrograma/${idPrograma}`);
}

//Obtener a un objLote por Id
obtenerLotePorId(id: number): Observable<Lote>{
 return this.http.get<Lote>(`${this.apiUrl}/${id}`);
}

//Crear Lote
crearLote(lote: Lote): Observable<Lote>{
return this.http.post<Lote>(this.apiUrl,lote);
}
//Actualizar Lote
actualizarLote(id : number, lote: Lote): Observable<Lote>{
return this.http.post<Lote>(`${this.apiUrl}/${id}`,lote);
}
//Eliminar Lote(Eliminacion Fisica :c)
eliminarLote(id : number): Observable<void>{
return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
  
//Combobox Programa
listarPrograma(): Observable<Programa[]> {
  return this.http.get<Programa[]>(this.programaUrl);
}
}