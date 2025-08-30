// src/app/services/letracambio.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GenerarLetrasRequest } from '../dto/generarletra.dto';
import { LetraCambio } from '../models/letra-cambio.model';


@Injectable({
  providedIn: 'root'
})
export class LetrasCambioService {
  private apiUrl = 'http://localhost:8080/api/letras';

  constructor(private http: HttpClient) {}

 listarPorContrato(idContrato: number): Observable<LetraCambio[]> {
    const url = `${this.apiUrl}/listar/${idContrato}`; 
    return this.http.get<LetraCambio[]>(url);
}

  generarLetras(idContrato: number, request: GenerarLetrasRequest): Observable<void> {
    const url = `${this.apiUrl}/contrato/${idContrato}`;
    return this.http.post<void>(url, request);
  }
}
