import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContratoResponseDTO } from '../dto/contratoreponse.dto';
import { TransferenciaResponseDTO } from '../dto/Transferenciaresponse.dto';
import { ContratoRequestDTO } from '../dto/contratorequest.dto';
import { environment } from '../../environments/environment';

// ✅ NUEVO: respuesta del endpoint /impacto-edicion
export interface ImpactoEdicionDTO {
  tieneLetras:    boolean;
  tienePagos:     boolean;
  cantidadLetras: number;
  cantidadPagos:  number;
}

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

  private readonly apiUrl = `${environment.apiUrl}/api/contratos`;

  constructor(private http: HttpClient) { }

  listarContrato(): Observable<ContratoResponseDTO[]> {
    return this.http.get<ContratoResponseDTO[]>(`${this.apiUrl}/listar`);
  }

  obtenerContratoPorId(id: number): Observable<ContratoResponseDTO> {
    return this.http.get<ContratoResponseDTO>(`${this.apiUrl}/${id}`);
  }

  buscarPorProgramaManzanaLote(idPrograma: number, manzana: string, numeroLote: string): Observable<ContratoResponseDTO> {
    const params = new HttpParams()
      .set('idPrograma', idPrograma.toString())
      .set('manzana', manzana)
      .set('numeroLote', numeroLote);
    return this.http.get<ContratoResponseDTO>(`${this.apiUrl}/buscar-por-lote`, { params });
  }

  buscarPorNombreCliente(termino: string): Observable<ContratoResponseDTO[]> {
    return this.http.get<ContratoResponseDTO[]>(`${this.apiUrl}/buscar-por-cliente`, {
      params: new HttpParams().set('termino', termino)
    });
  }

  guardarContrato(request: ContratoRequestDTO): Observable<ContratoResponseDTO> {
    return this.http.post<ContratoResponseDTO>(`${this.apiUrl}/agregar`, request);
  }

  actualizarContrato(id: number, request: ContratoRequestDTO): Observable<ContratoResponseDTO> {
    return this.http.put<ContratoResponseDTO>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  eliminarContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }

  imprimirContratoPdf(id: number): Observable<Blob> {
    const timestamp = new Date().getTime();
    return this.http.get(`${this.apiUrl}/${id}/imprimir?t=${timestamp}`, {
      responseType: 'blob'
    });
  }

  cambiarEstado(id: number, estado: string): Observable<ContratoResponseDTO> {
    const params = new HttpParams().set('estado', estado);
    return this.http.patch<ContratoResponseDTO>(`${this.apiUrl}/${id}/estado`, null, { params });
  }

  registrarRenuncia(id: number): Observable<ContratoResponseDTO> {
    return this.http.patch<ContratoResponseDTO>(`${this.apiUrl}/${id}/renuncia`, null);
  }

  registrarTransferencia(id: number): Observable<TransferenciaResponseDTO> {
    return this.http.patch<TransferenciaResponseDTO>(`${this.apiUrl}/${id}/transferencia`, null);
  }

  //consulta previa al editar — informa si hay letras/pagos en riesgo
  consultarImpactoEdicion(id: number): Observable<ImpactoEdicionDTO> {
    return this.http.get<ImpactoEdicionDTO>(`${this.apiUrl}/${id}/impacto-edicion`);
  }
}