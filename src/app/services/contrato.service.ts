import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContratoResponseDTO } from '../dto/contratoreponse.dto'; 
import { ContratoRequestDTO } from '../dto/contratorequest.dto';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/contratos'; 

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  listarContrato(): Observable<ContratoResponseDTO[]> {
    return this.http.get<ContratoResponseDTO[]>(`${this.apiUrl}/listar`);
  }

  obtenerContratoPorId(id: number): Observable<ContratoResponseDTO> {
    return this.http.get<ContratoResponseDTO>(`${this.apiUrl}/${id}`);
  }

  guardarContrato(request: ContratoRequestDTO): Observable<ContratoResponseDTO> {
    return this.http.post<ContratoResponseDTO>(`${this.apiUrl}/agregar`, request, { headers: this.getHeaders() });
  }

  actualizarContrato(id: number, request: ContratoRequestDTO): Observable<ContratoResponseDTO> {
    return this.http.put<ContratoResponseDTO>(`${this.apiUrl}/actualizar/${id}`, request, { 
      headers: this.getHeaders() 
    });
  }

  eliminarContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }

  //Método para descargar el PDF generado en el Backend
  imprimirContratoPdf(id: number): Observable<Blob> {
    const timestamp = new Date().getTime();
    return this.http.get(`${this.apiUrl}/${id}/imprimir?t=${timestamp}`, { 
      responseType: 'blob' 
    });
  }
}