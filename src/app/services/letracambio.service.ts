// src/app/services/letracambio.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GenerarLetrasRequest } from '../dto/generarletra.dto';
import { LetraCambio } from '../models/letra-cambio.model';
import { ReporteLetraCambioDTO } from '../dto/reporteletracambio.dto';
import { ReporteCronogramaPagosClientesDTO } from '../dto/reportecronogramapagocli.dto';


@Injectable({
  providedIn: 'root'
})
export class LetrasCambioService {
  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/letras';

  constructor(private http: HttpClient) {}

 listarPorContrato(idContrato: number): Observable<LetraCambio[]> {
    const url = `${this.apiUrl}/listar/${idContrato}`; 
    return this.http.get<LetraCambio[]>(url);
}

  generarLetras(idContrato: number, request: GenerarLetrasRequest): Observable<void> {
    const url = `${this.apiUrl}/contrato/${idContrato}`;
    return this.http.post<void>(url, request);
  }
  
  actualizarLetra(idLetra: number, letra: LetraCambio): Observable<LetraCambio> {
    return this.http.put<LetraCambio>(`${this.apiUrl}/actualizar/${idLetra}`, letra);
  }

  eliminarPorContrato(idContrato: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${idContrato}`);
  }

  // Obtener el reporte de letras de cambio
  obtenerReportePorContrato(idContrato: number): Observable<ReporteLetraCambioDTO[]> {
    const url = `${this.apiUrl}/reporte/${idContrato}`;
    return this.http.get<ReporteLetraCambioDTO[]>(url);
  }

    // Nuevo método para consumir la API del cronograma de pagos
  obtenerReporteCronogramaPagosPorContrato(idContrato: number): Observable<ReporteCronogramaPagosClientesDTO[]> {
    const url = `${this.apiUrl}/repcronograma/${idContrato}`;
    return this.http.get<ReporteCronogramaPagosClientesDTO[]>(url);
  }
}
