import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContratoResponseDTO } from '../dto/contratoreponse.dto'; 
import { ContratoRequestDTO } from '../dto/contratorequest.dto';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

  private apiUrl = 'http://localhost:8081/api/contratos'; 

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  listarContrato(): Observable<ContratoResponseDTO[]> {
    return this.http.get<ContratoResponseDTO[]>(`${this.apiUrl}/listar`);
  }

  //Método modificado para reflejar el tipo de retorno del backend
  guardarContrato(request: ContratoRequestDTO): Observable<ContratoResponseDTO> {
    return this.http.post<ContratoResponseDTO>(`${this.apiUrl}/agregar`, request, { headers: this.getHeaders() });
  }

  eliminarContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}