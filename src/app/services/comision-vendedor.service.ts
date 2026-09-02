import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ComisionVendedorDTO,
  PagoComisionMensualDTO,
  PagoComisionResultadoDTO,
  RegistrarAdelantoRequest,
  RegistrarPagosMensualesRequest
} from '../dto/comision-vendedor.dto';

@Injectable({ providedIn: 'root' })
export class ComisionVendedorService {

  private readonly apiUrl = `${environment.apiUrl}/api/comisiones`;

  constructor(private http: HttpClient) {}

  listarComisiones(): Observable<ComisionVendedorDTO[]> {
    return this.http.get<ComisionVendedorDTO[]>(this.apiUrl);
  }

  pagosMensualesHabilitados(idComision: number): Observable<PagoComisionMensualDTO[]> {
    return this.http.get<PagoComisionMensualDTO[]>(`${this.apiUrl}/${idComision}/pagos-habilitados`);
  }

  registrarAdelanto(request: RegistrarAdelantoRequest): Observable<PagoComisionResultadoDTO> {
    return this.http.post<PagoComisionResultadoDTO>(`${this.apiUrl}/adelantos`, request);
  }

  actualizarMontoComision(idComision: number, monto: number): Observable<ComisionVendedorDTO> {
    return this.http.put<ComisionVendedorDTO>(`${this.apiUrl}/monto`, { idComision, monto });
  }

  registrarPagosMensuales(request: RegistrarPagosMensualesRequest): Observable<PagoComisionResultadoDTO> {
    return this.http.post<PagoComisionResultadoDTO>(`${this.apiUrl}/pagos`, request);
  }

  descargarEgresoPdf(numeroEgreso: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/egresos/${numeroEgreso}/pdf`, { responseType: 'blob' });
  }
}