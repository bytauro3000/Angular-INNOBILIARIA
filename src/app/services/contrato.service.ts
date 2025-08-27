import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contrato } from '../models/contrato.model';
import { ContratoRequest } from '../dto/contratorequest.dto'; // Importa el DTO desde su ubicación

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

  private apiUrl = 'http://localhost:8080/api/contratos'; 

  constructor(private http: HttpClient) { }

  // Encabezados para las solicitudes HTTP, útil para enviar JSON.
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getContratos(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(`${this.apiUrl}/listar`);
  }


  guardarContrato(request: ContratoRequest): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.apiUrl}/agregar`, request, { headers: this.getHeaders() });
  }
}