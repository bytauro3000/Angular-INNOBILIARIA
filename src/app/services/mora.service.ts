import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CalculoMoraDTO } from '../dto/calculomora.dto';
import { MoraResponse } from '../dto/moraresponse.dto';
import { MoraResumenContratoDTO } from '../dto/moraresumencontrato.dto';
import { PagoMoraRequest } from '../dto/pagomorarequest.dto';
import { PagoMoraResponse } from '../dto/pagomoraresponse.dto';

@Injectable({ providedIn: 'root' })
export class MoraService {

  private apiUrl = `${environment.apiUrl}/api/moras`;

  constructor(private http: HttpClient) {}

  calcularMora(idLetra: number): Observable<CalculoMoraDTO> {
    return this.http.get<CalculoMoraDTO>(`${this.apiUrl}/calcular/${idLetra}`);
  }

  /**
   * Calcula la mora usando una fecha de referencia específica.
   * Se usa cuando el usuario registra un pago con fecha de operación retroactiva,
   * para que el monto de mora refleje los días reales hasta esa fecha y no hasta hoy.
   */
  calcularMoraConFecha(idLetra: number, fecha: string): Observable<CalculoMoraDTO> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<CalculoMoraDTO>(`${this.apiUrl}/calcular/${idLetra}`, { params });
  }

  listarPorContrato(idContrato: number): Observable<MoraResponse[]> {
    return this.http.get<MoraResponse[]>(`${this.apiUrl}/contrato/${idContrato}`);
  }

  listarPendientesPorContrato(idContrato: number): Observable<MoraResponse[]> {
    return this.http.get<MoraResponse[]>(`${this.apiUrl}/contrato/${idContrato}/pendientes`);
  }

  listarPorLetra(idLetra: number): Observable<MoraResponse[]> {
    return this.http.get<MoraResponse[]>(`${this.apiUrl}/letra/${idLetra}`);
  }

  obtenerResumenPorContrato(idContrato: number): Observable<MoraResumenContratoDTO> {
    return this.http.get<MoraResumenContratoDTO>(`${this.apiUrl}/contrato/${idContrato}/resumen`);
  }

  pagarMora(request: PagoMoraRequest, vouchers?: File[]): Observable<PagoMoraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (vouchers && vouchers.length > 0) {
      vouchers.forEach(v => formData.append('vouchers', v));
    }
    return this.http.post<PagoMoraResponse>(`${this.apiUrl}/pagar`, formData);
  }

  anularMora(idMora: number, motivo: string = ''): Observable<MoraResponse> {
    return this.http.patch<MoraResponse>(
      `${this.apiUrl}/${idMora}/anular`,
      null,
      { params: new HttpParams().set('motivo', motivo) }
    );
  }

  sugerirNumeroComprobante(tipoComprobante: string): Observable<{ numeroSugerido: string }> {
    return this.http.get<{ numeroSugerido: string }>(
      `${this.apiUrl}/sugerir-numero?tipoComprobante=${tipoComprobante}`
    );
  }

  descargarComprobante(idPagoMora: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/pago/${idPagoMora}/comprobante-pdf`,
      { responseType: 'blob' }
    );
  }

  crearMoraPendiente(idLetra: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/crear-pendiente/${idLetra}`, {});
}
}